/**
 * Task Template Service
 * Manages task templates (admin operations)
 */

import prisma from "@/lib/prisma";
import { CreateTaskTemplate, TaskTemplate } from "@/types/task-system";

class TaskTemplateService {
  /**
   * Create a new task template
   */
  async createTemplate(
    organizationId: string,
    payload: CreateTaskTemplate
  ): Promise<TaskTemplate> {
    const template = await prisma.taskTemplate.create({
      data: {
        organizationId,
        name: payload.name,
        description: payload.description,
        role: payload.role,
        type: payload.type,
        isFormBased: payload.isFormBased,
        contextFields: payload.contextFields,
        instructions: payload.instructions,
        estimatedHours: payload.estimatedHours,
        successCriteria: payload.successCriteria
          ? JSON.stringify(payload.successCriteria)
          : undefined,
      },
    });

    // Add form sections if form-based
    if (payload.isFormBased && payload.sections) {
      for (const section of payload.sections) {
        await prisma.formSection.create({
          data: {
            templateId: template.id,
            title: section.title,
            description: section.description,
            position: section.position || 0,
            fields: {
              create: section.fields.map((field, idx) => ({
                name: field.name,
                label: field.label,
                type: field.type,
                required: field.required ?? true,
                placeholder: field.placeholder,
                helpText: field.helpText,
                options: field.options ? JSON.stringify(field.options) : undefined,
                validation: field.validation
                  ? JSON.stringify(field.validation)
                  : undefined,
                position: field.position ?? idx,
              })),
            },
          },
        });
      }
    }

    return this.getTemplate(template.id) as Promise<TaskTemplate>;
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<TaskTemplate | null> {
    const template = await prisma.taskTemplate.findUnique({
      where: { id: templateId },
      include: {
        sections: {
          include: { fields: true },
          orderBy: { position: "asc" },
        },
      },
    });

    return template ? this.formatTemplate(template) : null;
  }

  /**
   * Get all templates for an organization
   */
  async getTemplatesByOrganization(organizationId: string): Promise<TaskTemplate[]> {
    const templates = await prisma.taskTemplate.findMany({
      where: { organizationId, isActive: true },
      include: {
        sections: {
          include: { fields: true },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return templates.map((t: typeof templates[number]) => this.formatTemplate(t));
  }

  /**
   * Get templates by role
   */
  async getTemplatesByRole(
    organizationId: string,
    role: string
  ): Promise<TaskTemplate[]> {
    const templates = await prisma.taskTemplate.findMany({
      where: { organizationId, role, isActive: true },
      include: {
        sections: {
          include: { fields: true },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return templates.map((t: typeof templates[number]) => this.formatTemplate(t));
  }

  /**
   * Get templates by type
   */
  async getTemplatesByType(
    organizationId: string,
    type: string
  ): Promise<TaskTemplate[]> {
    const templates = await prisma.taskTemplate.findMany({
      where: { organizationId, type, isActive: true },
      include: {
        sections: {
          include: { fields: true },
          orderBy: { position: "asc" },
        },
      },
    });

    return templates.map((t: typeof templates[number]) => this.formatTemplate(t));
  }

  /**
   * Update a template
   */
  async updateTemplate(
    templateId: string,
    payload: Partial<CreateTaskTemplate>
  ): Promise<TaskTemplate> {
    const updated = await prisma.taskTemplate.update({
      where: { id: templateId },
      data: {
        name: payload.name,
        description: payload.description,
        instructions: payload.instructions,
        estimatedHours: payload.estimatedHours,
        successCriteria: payload.successCriteria
          ? JSON.stringify(payload.successCriteria)
          : undefined,
      },
      include: {
        sections: {
          include: { fields: true },
          orderBy: { position: "asc" },
        },
      },
    });

    return this.formatTemplate(updated);
  }

  /**
   * Deactivate a template
   */
  async deactivateTemplate(templateId: string): Promise<TaskTemplate> {
    const template = await prisma.taskTemplate.update({
      where: { id: templateId },
      data: { isActive: false },
      include: {
        sections: {
          include: { fields: true },
          orderBy: { position: "asc" },
        },
      },
    });

    return this.formatTemplate(template);
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    // Delete related data
    await prisma.formSection.deleteMany({ where: { templateId } });
    await prisma.taskTemplate.delete({ where: { id: templateId } });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────────────────────

  private formatTemplate(template: any): TaskTemplate {
    return {
      id: template.id,
      organizationId: template.organizationId,
      name: template.name,
      description: template.description,
      role: template.role,
      type: template.type,
      isFormBased: template.isFormBased,
      contextFields: template.contextFields,
      instructions: template.instructions,
      estimatedHours: template.estimatedHours,
      successCriteria: template.successCriteria
        ? typeof template.successCriteria === 'string'
          ? JSON.parse(template.successCriteria)
          : template.successCriteria
        : undefined,
      isActive: template.isActive,
      sections: template.sections?.map((section: any) => ({
        id: section.id,
        templateId: section.templateId,
        title: section.title,
        description: section.description,
        position: section.position,
        fields: section.fields?.map((field: any) => ({
          id: field.id,
          sectionId: field.sectionId,
          name: field.name,
          label: field.label,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder,
          helpText: field.helpText,
          options: field.options
            ? typeof field.options === 'string'
              ? JSON.parse(field.options)
              : field.options
            : undefined,
          validation: field.validation
            ? typeof field.validation === 'string'
              ? JSON.parse(field.validation)
              : field.validation
            : undefined,
          position: field.position,
          createdAt: field.createdAt,
          updatedAt: field.updatedAt,
        })) || [],
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
      })) || [],
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }
}

export const taskTemplateService = new TaskTemplateService();
