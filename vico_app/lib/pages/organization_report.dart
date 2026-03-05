import 'package:flutter/material.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../services/api_service.dart';

class OrganizationReportPage extends StatefulWidget {
  const OrganizationReportPage({super.key});

  @override
  State<OrganizationReportPage> createState() => _OrganizationReportPageState();
}

class _OrganizationReportPageState extends State<OrganizationReportPage> {
  final ApiService api = ApiService();
  late Future<List<dynamic>> _orgs;
  bool _isGenerating = false;

  @override
  void initState() {
    super.initState();
    _orgs = api.fetchOrganizations();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Organization Report'),
        backgroundColor: Color(0xFF0EA5E9),
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _orgs,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          final orgs = snapshot.data ?? [];
          return _buildReportView(orgs);
        },
      ),
    );
  }

  Widget _buildReportView(List<dynamic> orgs) {
    final totalOrgs = orgs.length;
    final totalPlayers = orgs.fold<int>(0, (sum, org) => sum + ((org['players']?.length ?? 0) as int));
    final totalStaff = orgs.fold<int>(0, (sum, org) => sum + ((org['staff']?.length ?? 0) as int));
    final totalInventory = orgs.fold<int>(0, (sum, org) => sum + ((org['inventory']?.length ?? 0) as int));

    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            width: double.infinity,
            padding: EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF0EA5E9), Color(0xFF3B82F6)],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Organizations Report',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Generated on ${DateTime.now().toString().split(' ')[0]}',
                  style: TextStyle(color: Colors.white70),
                ),
              ],
            ),
          ),
          SizedBox(height: 24),

          // Summary Stats
          Text(
            'Summary Statistics',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 16),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            childAspectRatio: 1.5,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            children: [
              _buildStatCard('Total Organizations', totalOrgs.toString(), Icons.business, Color(0xFF0EA5E9)),
              _buildStatCard('Total Members', totalPlayers.toString(), Icons.people, Color(0xFF10B981)),
              _buildStatCard('Total Staff', totalStaff.toString(), Icons.group, Color(0xFF8B5CF6)),
              _buildStatCard('Inventory Items', totalInventory.toString(), Icons.inventory, Color(0xFFF59E0B)),
            ],
          ),
          SizedBox(height: 32),

          // Organizations Details
          Text(
            'Organization Details',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 16),
          ...orgs.map((org) => _buildOrgDetailCard(org)).toList(),

          SizedBox(height: 32),

          // Action Buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              ElevatedButton.icon(
                onPressed: _isGenerating ? null : () => _generateAndDownloadPDF(orgs),
                icon: _isGenerating
                    ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Icon(Icons.download),
                label: Text(_isGenerating ? 'Generating...' : 'Download PDF'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF0EA5E9),
                  padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4)],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 32, color: color),
          SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color),
          ),
          SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildOrgDetailCard(dynamic org) {
    final players = org['players'] ?? [];
    final staff = org['staff'] ?? [];
    final inventory = org['inventory'] ?? [];

    return Container(
      margin: EdgeInsets.only(bottom: 16),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[300]!),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: Color(int.parse((org['primaryColor'] ?? '#0EA5E9').replaceFirst('#', ''), radix: 16) + 0xFF000000),
                  borderRadius: BorderRadius.circular(25),
                ),
                child: Center(
                  child: Text(
                    org['name']?.toString().substring(0, 1).toUpperCase() ?? 'O',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20),
                  ),
                ),
              ),
              SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      org['name'] ?? 'Organization',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    if (org['city'] != null || org['country'] != null)
                      Text(
                        '${org['city'] ?? ''}${org['city'] != null && org['country'] != null ? ', ' : ''}${org['country'] ?? ''}',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 16),

          // Stats
          Row(
            children: [
              _buildMiniStat('Members', players.length.toString(), Icons.people),
              SizedBox(width: 16),
              _buildMiniStat('Staff', staff.length.toString(), Icons.group),
              SizedBox(width: 16),
              _buildMiniStat('Inventory', inventory.length.toString(), Icons.inventory),
            ],
          ),

          // Description
          if (org['description'] != null) ...[
            SizedBox(height: 12),
            Text(
              org['description'],
              style: TextStyle(color: Colors.grey[700]),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey[600]),
        SizedBox(width: 4),
        Text(
          '$label: $value',
          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
        ),
      ],
    );
  }

  Future<void> _generateAndDownloadPDF(List<dynamic> orgs) async {
    setState(() => _isGenerating = true);

    try {
      final pdf = pw.Document();

      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: pw.EdgeInsets.all(32),
          build: (pw.Context context) {
            return [
              // Header
              pw.Container(
                padding: pw.EdgeInsets.all(16),
                decoration: pw.BoxDecoration(
                  color: PdfColor.fromHex('#0EA5E9'),
                  borderRadius: pw.BorderRadius.circular(8),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      'Organizations Report',
                      style: pw.TextStyle(
                        color: PdfColors.white,
                        fontSize: 24,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                    pw.SizedBox(height: 8),
                    pw.Text(
                      'Generated on ${DateTime.now().toString().split(' ')[0]}',
                      style: pw.TextStyle(color: PdfColor.fromHex('#F0F0F0')),
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 20),

              // Summary
              pw.Text('Summary Statistics', style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 10),
              pw.Row(
                children: [
                  pw.Expanded(
                    child: pw.Container(
                      padding: pw.EdgeInsets.all(12),
                      decoration: pw.BoxDecoration(
                        border: pw.Border.all(color: PdfColors.grey300),
                        borderRadius: pw.BorderRadius.circular(8),
                      ),
                      child: pw.Column(
                        children: [
                          pw.Text('Total Organizations', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                          pw.Text(orgs.length.toString(), style: pw.TextStyle(fontSize: 20)),
                        ],
                      ),
                    ),
                  ),
                  pw.SizedBox(width: 10),
                  pw.Expanded(
                    child: pw.Container(
                      padding: pw.EdgeInsets.all(12),
                      decoration: pw.BoxDecoration(
                        border: pw.Border.all(color: PdfColors.grey300),
                        borderRadius: pw.BorderRadius.circular(8),
                      ),
                      child: pw.Column(
                        children: [
                          pw.Text('Total Members', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                          pw.Text(orgs.fold<int>(0, (sum, org) => sum + ((org['players']?.length ?? 0) as int)).toString(), style: pw.TextStyle(fontSize: 20)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              pw.SizedBox(height: 20),

              // Organizations
              pw.Text('Organization Details', style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 10),
              ...orgs.map((org) => pw.Container(
                margin: pw.EdgeInsets.only(bottom: 16),
                padding: pw.EdgeInsets.all(16),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.grey300),
                  borderRadius: pw.BorderRadius.circular(8),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(org['name'] ?? 'Organization', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
                    if (org['city'] != null || org['country'] != null)
                      pw.Text('${org['city'] ?? ''}${org['city'] != null && org['country'] != null ? ', ' : ''}${org['country'] ?? ''}'),
                    pw.SizedBox(height: 8),
                    pw.Text('Members: ${org['players']?.length ?? 0} | Staff: ${org['staff']?.length ?? 0} | Inventory: ${org['inventory']?.length ?? 0}'),
                    if (org['description'] != null) ...[
                      pw.SizedBox(height: 8),
                      pw.Text(org['description']),
                    ],
                  ],
                ),
              )),
            ];
          },
        ),
      );

      await Printing.sharePdf(bytes: await pdf.save(), filename: 'organizations-report.pdf');

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('PDF generated successfully!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to generate PDF: $e')),
      );
    } finally {
      setState(() => _isGenerating = false);
    }
  }
}