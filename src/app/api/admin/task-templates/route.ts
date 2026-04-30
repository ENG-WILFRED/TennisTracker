import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/authMiddleware";
import prisma from "@/lib/prisma";
import { taskTemplateService } from "@/services/task-template.service";
import { CreateTaskTemplate } from "@/types/task-system";

/**
 * GET /api/admin/task-templates
 * Get all task templates for organization
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyApiAuth(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("organizationId");
    const role = searchParams.get("role");
    const type = searchParams.get("type");

    if (!orgId) {
      return NextResponse.json(
        { error: "organizationId required" },
        { status: 400 }
      );
    }

    let templates;
    if (role) {
      templates = await taskTemplateService.getTemplatesByRole(orgId, role);
    } else if (type) {
      templates = await taskTemplateService.getTemplatesByType(orgId, type);
    } else {
      templates = await taskTemplateService.getTemplatesByOrganization(orgId);
    }

    return NextResponse.json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/task-templates
 * Create a new task template
 */
export async function POST(req: NextRequest) {
  try {
    const authUser  = await verifyApiAuth(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload: {
      organizationId: string;
      template: CreateTaskTemplate;
    } = await req.json();

    if (!payload.organizationId || !payload.template) {
      return NextResponse.json(
        { error: "organizationId and template required" },
        { status: 400 }
      );
    }

    // Verify user is admin of organization
    const isAdmin = await prisma.staff.findFirst({
      where: {
        userId: authUser.userId,
        role: "admin",
      },
    });

    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    
    const template = await taskTemplateService.createTemplate(
      payload.organizationId,
      payload.template
    );

    return NextResponse.json({
      success: true,
      data: template,
      message: "Template created successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
