"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedOrganizations = seedOrganizations;
var index_js_1 = require("../../src/generated/prisma/index.js");
var bcryptjs_1 = require("bcryptjs");
var prisma = new index_js_1.PrismaClient();
var DEMO_PASSWORD = 'tennis123';
function seedOrganizations() {
    return __awaiter(this, void 0, void 0, function () {
        var hashedPassword, organizationData, createdOrgs, createdOrgAdmins, _i, organizationData_1, _a, orgData, adminData, financeData, organization, adminUser, financeUser, updatedOrg, adminPlayer, financePlayer, _b, createdOrgAdmins_1, _c, organization, admin, finance;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('🏢 Seeding organizations with admin accounts...\n');
                    return [4 /*yield*/, bcryptjs_1.default.hash(DEMO_PASSWORD, 10)];
                case 1:
                    hashedPassword = _d.sent();
                    organizationData = [
                        {
                            org: {
                                name: 'Central Tennis Club',
                                slug: 'central-tennis-club',
                                description: 'Premier tennis facility in downtown area with 8 courts',
                                address: '123 Main Street',
                                city: 'New York',
                                country: 'USA',
                                phone: '+1-555-0100',
                                email: 'contact@centraltennis.com',
                                logo: 'https://images.unsplash.com/photo-1554224311-beee415c15ae?w=500&q=80',
                                primaryColor: '#2563eb',
                                rating: 4.8,
                                ratingCount: 156,
                                verifiedBadge: true,
                                activityScore: 92,
                                playerDevScore: 88,
                                tournamentEngScore: 85,
                            },
                            admin: {
                                username: 'central_admin',
                                email: 'admin@centraltennis.com',
                                firstName: 'Central',
                                lastName: 'Admin',
                                phone: '+1-555-0101',
                                gender: 'Male',
                                bio: 'Organization admin for Central Tennis Club',
                            },
                            finance: {
                                username: 'central_finance',
                                email: 'finance@centraltennis.com',
                                firstName: 'Finance',
                                lastName: 'Manager',
                                phone: '+1-555-0102',
                                gender: 'Female',
                                bio: 'Finance officer for Central Tennis Club',
                            },
                        },
                        {
                            org: {
                                name: 'Elite Sports Academy',
                                slug: 'elite-sports-academy',
                                description: 'International-level coaching and training facility',
                                address: '456 Academy Lane',
                                city: 'Los Angeles',
                                country: 'USA',
                                phone: '+1-555-0200',
                                email: 'info@elitesports.com',
                                logo: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&q=80',
                                primaryColor: '#16a34a',
                                rating: 4.9,
                                ratingCount: 203,
                                verifiedBadge: true,
                                activityScore: 96,
                                playerDevScore: 94,
                                tournamentEngScore: 92,
                            },
                            admin: {
                                username: 'elite_admin',
                                email: 'admin@elitesports.com',
                                firstName: 'Elite',
                                lastName: 'Admin',
                                phone: '+1-555-0201',
                                gender: 'Female',
                                bio: 'Organization admin for Elite Sports Academy',
                            },
                            finance: {
                                username: 'elite_finance',
                                email: 'finance@elitesports.com',
                                firstName: 'Elite',
                                lastName: 'Finance',
                                phone: '+1-555-0202',
                                gender: 'Male',
                                bio: 'Finance officer for Elite Sports Academy',
                            },
                        },
                        {
                            org: {
                                name: 'Community Tennis Courts',
                                slug: 'community-tennis-courts',
                                description: 'Affordable public tennis facility for the community',
                                address: '789 Park Avenue',
                                city: 'Chicago',
                                country: 'USA',
                                phone: '+1-555-0300',
                                email: 'admin@communitytennis.org',
                                logo: 'https://images.unsplash.com/photo-1638631055336-5c7a2a6e4f4b?w=500&q=80',
                                primaryColor: '#dc2626',
                                rating: 4.5,
                                ratingCount: 98,
                                verifiedBadge: false,
                                activityScore: 78,
                                playerDevScore: 72,
                                tournamentEngScore: 80,
                            },
                            admin: {
                                username: 'community_admin',
                                email: 'admin@communitytennis.org',
                                firstName: 'Community',
                                lastName: 'Admin',
                                phone: '+1-555-0301',
                                gender: 'Female',
                                bio: 'Organization admin for Community Tennis Courts',
                            },
                            finance: {
                                username: 'community_finance',
                                email: 'finance@communitytennis.org',
                                firstName: 'Community',
                                lastName: 'Finance',
                                phone: '+1-555-0302',
                                gender: 'Male',
                                bio: 'Finance officer for Community Tennis Courts',
                            },
                        },
                    ];
                    createdOrgs = [];
                    createdOrgAdmins = [];
                    _i = 0, organizationData_1 = organizationData;
                    _d.label = 2;
                case 2:
                    if (!(_i < organizationData_1.length)) return [3 /*break*/, 12];
                    _a = organizationData_1[_i], orgData = _a.org, adminData = _a.admin, financeData = _a.finance;
                    return [4 /*yield*/, prisma.organization.upsert({
                            where: { name: orgData.name },
                            update: orgData,
                            create: orgData,
                        })];
                case 3:
                    organization = _d.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: adminData.email },
                            update: {
                                firstName: adminData.firstName,
                                lastName: adminData.lastName,
                                phone: adminData.phone,
                                bio: adminData.bio,
                            },
                            create: {
                                username: adminData.username,
                                email: adminData.email,
                                passwordHash: hashedPassword,
                                firstName: adminData.firstName,
                                lastName: adminData.lastName,
                                phone: adminData.phone,
                                gender: adminData.gender,
                                bio: adminData.bio,
                                photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80',
                            },
                        })];
                case 4:
                    adminUser = _d.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: financeData.email },
                            update: {
                                firstName: financeData.firstName,
                                lastName: financeData.lastName,
                                phone: financeData.phone,
                                bio: financeData.bio,
                            },
                            create: {
                                username: financeData.username,
                                email: financeData.email,
                                passwordHash: hashedPassword,
                                firstName: financeData.firstName,
                                lastName: financeData.lastName,
                                phone: financeData.phone,
                                gender: financeData.gender,
                                bio: financeData.bio,
                                photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&q=80',
                            },
                        })];
                case 5:
                    financeUser = _d.sent();
                    return [4 /*yield*/, prisma.organization.update({
                            where: { id: organization.id },
                            data: { createdBy: adminUser.id },
                        })];
                case 6:
                    updatedOrg = _d.sent();
                    return [4 /*yield*/, prisma.player.upsert({
                            where: { userId: adminUser.id },
                            update: {},
                            create: {
                                userId: adminUser.id,
                            },
                        })];
                case 7:
                    adminPlayer = _d.sent();
                    return [4 /*yield*/, prisma.player.upsert({
                            where: { userId: financeUser.id },
                            update: {},
                            create: {
                                userId: financeUser.id,
                            },
                        })];
                case 8:
                    financePlayer = _d.sent();
                    // Add admin as ClubMember with admin role
                    return [4 /*yield*/, prisma.clubMember.upsert({
                            where: {
                                organizationId_playerId_role: {
                                    playerId: adminUser.id,
                                    organizationId: updatedOrg.id,
                                    role: 'admin',
                                },
                            },
                            update: { role: 'admin' },
                            create: {
                                playerId: adminUser.id,
                                organizationId: updatedOrg.id,
                                role: 'admin',
                                paymentStatus: 'paid',
                            },
                        })];
                case 9:
                    // Add admin as ClubMember with admin role
                    _d.sent();
                    // Add finance officer as ClubMember with officer role
                    return [4 /*yield*/, prisma.clubMember.upsert({
                            where: {
                                organizationId_playerId_role: {
                                    playerId: financeUser.id,
                                    organizationId: updatedOrg.id,
                                    role: 'officer',
                                },
                            },
                            update: { role: 'officer' },
                            create: {
                                playerId: financeUser.id,
                                organizationId: updatedOrg.id,
                                role: 'officer',
                                paymentStatus: 'paid',
                            },
                        })];
                case 10:
                    // Add finance officer as ClubMember with officer role
                    _d.sent();
                    createdOrgs.push(updatedOrg);
                    createdOrgAdmins.push({ organization: updatedOrg, admin: adminUser, finance: financeUser });
                    console.log("  \u2713 ".concat(orgData.name));
                    console.log("    \u2514\u2500 Admin: ".concat(adminData.email, " (password: ").concat(DEMO_PASSWORD, ")"));
                    console.log("    \u2514\u2500 Finance: ".concat(financeData.email, " (password: ").concat(DEMO_PASSWORD, ")"));
                    _d.label = 11;
                case 11:
                    _i++;
                    return [3 /*break*/, 2];
                case 12:
                    console.log('\n📋 Organization Admin Login Credentials:');
                    console.log('───────────────────────────────────────────────────────────────');
                    for (_b = 0, createdOrgAdmins_1 = createdOrgAdmins; _b < createdOrgAdmins_1.length; _b++) {
                        _c = createdOrgAdmins_1[_b], organization = _c.organization, admin = _c.admin, finance = _c.finance;
                        console.log("\n".concat(organization.name, ":"));
                        console.log("  Admin   \u2192 ".concat(admin.email, " / ").concat(DEMO_PASSWORD));
                        console.log("  Finance \u2192 ".concat(finance.email, " / ").concat(DEMO_PASSWORD));
                    }
                    console.log('\n');
                    return [2 /*return*/, createdOrgs];
            }
        });
    });
}
