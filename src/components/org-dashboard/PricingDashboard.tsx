import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Edit2, Plus, DollarSign, Users, Target } from 'lucide-react';

interface PricingRule {
  id: string;
  ruleType: 'base' | 'tier' | 'coach';
  tierName?: string;
  coachName?: string;
  pricePerHour: number;
  description?: string;
  discountPercent?: number;
  reason?: string;
  isActive: boolean;
  coach?: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

interface PricingDashboardProps {
  organizationId: string;
  basePricing: {
    pricePerHour: number;
    currency?: string;
  };
}

export default function PricingDashboard({
  organizationId,
  basePricing,
}: PricingDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [tierName, setTierName] = useState('');
  const [tierPrice, setTierPrice] = useState('');
  const [tierDiscount, setTierDiscount] = useState('');
  const [tierDescription, setTierDescription] = useState('');

  const [coachId, setCoachId] = useState('');
  const [coachPrice, setCoachPrice] = useState('');
  const [coachTier, setCoachTier] = useState('');
  const [coachDescription, setCoachDescription] = useState('');
  const [coachReason, setCoachReason] = useState('');

  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  // Fetch pricing rules and coaches
  useEffect(() => {
    fetchPricingRules();
    fetchCoaches();
  }, [organizationId]);

  const fetchPricingRules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orgs/${organizationId}/pricing-dashboard`);
      if (!response.ok) throw new Error('Failed to fetch pricing rules');

      const data = await response.json();
      const formatted = [];

      // Add tier prices
      if (data.data?.tierPrices) {
        formatted.push(
          ...data.data.tierPrices.map((tier: any) => ({
            id: tier.id,
            ruleType: 'tier',
            tierName: tier.tierName,
            pricePerHour: tier.pricePerHour,
            discountPercent: tier.discountPercent,
            description: tier.description,
            isActive: tier.isActive,
          }))
        );
      }

      // Add coach prices
      if (data.data?.coachPrices) {
        formatted.push(
          ...data.data.coachPrices.map((coach: any) => ({
            id: coach.id,
            ruleType: 'coach',
            coachName: `${coach.staff.user.firstName} ${coach.staff.user.lastName}`,
            tierName: coach.tierName,
            pricePerHour: coach.pricePerHour,
            description: coach.description,
            reason: coach.reason,
            isActive: coach.isActive,
            coach: coach.staff,
          }))
        );
      }

      setPricingRules(formatted);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoaches = async () => {
    try {
      // In a real app, you'd fetch this from your API
      // For now, we'll use a placeholder
      const response = await fetch(`/api/orgs/${organizationId}/staff?role=coach`);
      if (response.ok) {
        const data = await response.json();
        setCoaches(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch coaches:', err);
    }
  };

  const handleAddTierPricing = async () => {
    if (!tierName || !tierPrice) {
      setError('Tier name and price are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/orgs/${organizationId}/pricing-dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleType: 'tier',
          tierName,
          pricePerHour: parseFloat(tierPrice),
          discountPercent: tierDiscount ? parseFloat(tierDiscount) / 100 : undefined,
          description: tierDescription,
        }),
      });

      if (!response.ok) throw new Error('Failed to add tier pricing');

      setSuccess(`Tier "${tierName}" pricing added successfully`);
      setTierName('');
      setTierPrice('');
      setTierDiscount('');
      setTierDescription('');
      setError(null);
      fetchPricingRules();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoachPricing = async () => {
    if (!coachId || !coachPrice) {
      setError('Coach and price are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/orgs/${organizationId}/pricing-dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleType: 'coach',
          coachId,
          pricePerHour: parseFloat(coachPrice),
          tierName: coachTier || undefined,
          description: coachDescription,
          reason: coachReason,
        }),
      });

      if (!response.ok) throw new Error('Failed to add coach pricing');

      setSuccess('Coach pricing added successfully');
      setCoachId('');
      setCoachPrice('');
      setCoachTier('');
      setCoachDescription('');
      setCoachReason('');
      setError(null);
      fetchPricingRules();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: string, ruleType: 'tier' | 'coach') => {
    if (!confirm('Are you sure you want to deactivate this pricing rule?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/orgs/${organizationId}/pricing-dashboard/${ruleId}?type=${ruleType}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) throw new Error('Failed to delete rule');

      setSuccess('Pricing rule deactivated');
      setError(null);
      fetchPricingRules();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscountedPrice = (basePrice: number, discount?: number) => {
    if (!discount) return basePrice;
    return basePrice * (1 - discount);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6" />
            Coaching Session Pricing Rules
          </CardTitle>
          <CardDescription>
            Set up flexible pricing based on member tiers and individual coaches
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Base Pricing Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Base Organization Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-3xl font-bold text-blue-600">
                ${basePricing.pricePerHour.toFixed(2)}
                <span className="text-sm text-gray-600 ml-2">/hour</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Default rate applied when no tier or coach pricing is configured
              </p>
            </div>
            <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded">
              <p className="font-semibold mb-2">Pricing Hierarchy:</p>
              <ol className="space-y-1 text-xs">
                <li>1. Coach + Tier specific</li>
                <li>2. Coach only</li>
                <li>3. Tier only</li>
                <li>4. Base price</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Rules Management */}
      <Tabs defaultValue="tiers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tiers" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Tier Pricing
          </TabsTrigger>
          <TabsTrigger value="coaches" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Coach Pricing
          </TabsTrigger>
        </TabsList>

        {/* Tier Pricing Tab */}
        <TabsContent value="tiers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Member Tier Pricing</CardTitle>
                  <CardDescription>
                    Set different rates for different membership tiers
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Tier Pricing
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Tier Pricing</DialogTitle>
                      <DialogDescription>
                        Create a pricing rule for a membership tier
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tierName">Tier Name</Label>
                        <Input
                          id="tierName"
                          placeholder="e.g., Premium, Gold, Silver"
                          value={tierName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTierName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tierPrice">Price per Hour ($)</Label>
                        <Input
                          id="tierPrice"
                          type="number"
                          step="0.01"
                          placeholder="e.g., 40.00"
                          value={tierPrice}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTierPrice(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tierDiscount">Discount (%)</Label>
                        <Input
                          id="tierDiscount"
                          type="number"
                          step="1"
                          placeholder="e.g., 20 for 20% off"
                          value={tierDiscount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTierDiscount(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tierDescription">Description</Label>
                        <Input
                          id="tierDescription"
                          placeholder="e.g., Premium members get exclusive coaching"
                          value={tierDescription}
                          onChange={(e) => setTierDescription(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleAddTierPricing}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Adding...' : 'Add Tier Pricing'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {pricingRules.filter((r) => r.ruleType === 'tier').length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No tier pricing rules yet. Create one to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {pricingRules
                    .filter((r) => r.ruleType === 'tier')
                    .map((rule) => (
                      <div
                        key={rule.id}
                        className="p-4 border rounded-lg flex items-center justify-between bg-blue-50"
                      >
                        <div className="flex-1">
                          <p className="font-semibold">{rule.tierName}</p>
                          <p className="text-sm text-gray-600">{rule.description}</p>
                          <div className="flex gap-4 mt-2">
                            <span className="text-lg font-bold text-blue-600">
                              ${rule.pricePerHour.toFixed(2)}/hr
                            </span>
                            {rule.discountPercent && (
                              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                                {(rule.discountPercent * 100).toFixed(0)}% off
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDeleteRule(rule.id, rule.ruleType as 'tier' | 'coach')
                          }
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coach Pricing Tab */}
        <TabsContent value="coaches">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Coach Specific Pricing</CardTitle>
                  <CardDescription>
                    Set premium rates for specific coaches or tiers
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Coach Pricing
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Coach Pricing</DialogTitle>
                      <DialogDescription>
                        Set a custom rate for a specific coach
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="coachSelect">Select Coach</Label>
                        <Select value={coachId} onValueChange={setCoachId}>
                          <SelectTrigger id="coachSelect">
                            <SelectValue placeholder="Select a coach" />
                          </SelectTrigger>
                          <SelectContent>
                            {coaches.map((coach) => (
                              <SelectItem key={coach.userId} value={coach.userId}>
                                {coach.user?.firstName} {coach.user?.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="coachPrice">Price per Hour ($)</Label>
                        <Input
                          id="coachPrice"
                          type="number"
                          step="0.01"
                          placeholder="e.g., 60.00"
                          value={coachPrice}
                          onChange={(e) => setCoachPrice(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="coachTier">Apply to Tier (Optional)</Label>
                        <Input
                          id="coachTier"
                          placeholder="e.g., Premium (leave blank for all tiers)"
                          value={coachTier}
                          onChange={(e) => setCoachTier(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="coachDescription">Description</Label>
                        <Input
                          id="coachDescription"
                          placeholder="e.g., Expert coach with 10+ years experience"
                          value={coachDescription}
                          onChange={(e) => setCoachDescription(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="coachReason">Reason</Label>
                        <Input
                          id="coachReason"
                          placeholder="e.g., Highly requested, negotiated rate"
                          value={coachReason}
                          onChange={(e) => setCoachReason(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleAddCoachPricing}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Adding...' : 'Add Coach Pricing'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {pricingRules.filter((r) => r.ruleType === 'coach').length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No coach pricing rules yet. Create one to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {pricingRules
                    .filter((r) => r.ruleType === 'coach')
                    .map((rule) => (
                      <div
                        key={rule.id}
                        className="p-4 border rounded-lg flex items-center justify-between bg-purple-50"
                      >
                        <div className="flex-1">
                          <p className="font-semibold">{rule.coachName}</p>
                          {rule.tierName && (
                            <p className="text-xs text-gray-600">
                              Only for {rule.tierName} tier
                            </p>
                          )}
                          <p className="text-sm text-gray-600">{rule.description}</p>
                          {rule.reason && (
                            <p className="text-xs text-gray-500 italic mt-1">
                              Reason: {rule.reason}
                            </p>
                          )}
                          <span className="text-lg font-bold text-purple-600 mt-2 block">
                            ${rule.pricePerHour.toFixed(2)}/hr
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDeleteRule(rule.id, rule.ruleType as 'tier' | 'coach')
                          }
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pricing Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pricing Examples</CardTitle>
          <CardDescription>How different member types are charged</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded bg-gray-50">
              <p className="font-semibold text-sm">Standard Member</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                ${basePricing.pricePerHour.toFixed(2)}/hr
              </p>
              <p className="text-xs text-gray-600 mt-1">Uses base organization rate</p>
            </div>

            <div className="p-4 border rounded bg-blue-50">
              <p className="font-semibold text-sm">Premium Member</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                $
                {(() => {
                  const tier = pricingRules.find(
                    (r) => r.ruleType === 'tier' && r.tierName === 'Premium'
                  );
                  return tier ? tier.pricePerHour.toFixed(2) : basePricing.pricePerHour.toFixed(2);
                })()}
                /hr
              </p>
              <p className="text-xs text-gray-600 mt-1">Premium tier rate (if configured)</p>
            </div>

            <div className="p-4 border rounded bg-purple-50">
              <p className="font-semibold text-sm">With Expert Coach</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">
                $
                {(() => {
                  const coach = pricingRules.find((r) => r.ruleType === 'coach');
                  return coach ? coach.pricePerHour.toFixed(2) : basePricing.pricePerHour.toFixed(2);
                })()}
                /hr
              </p>
              <p className="text-xs text-gray-600 mt-1">Premium coach rate (if configured)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
