"use server";

import { PrismaClient } from "../../src/generated/prisma";

const prisma = new PrismaClient();

export async function getAllStaff() {
    return await prisma.staff.findMany({ orderBy: { name: 'asc' } });
}

export async function getCoaches() {
    return await prisma.staff.findMany({ where: { role: { contains: 'Coach' } }, orderBy: { name: 'asc' } });
}

export async function getAvailableCoaches() {
    return await prisma.staff.findMany({ where: { role: { contains: 'Coach' }, employedById: null }, orderBy: { name: 'asc' } });
}

export async function employCoach(actorId: string | null, coachId: string) {
    if (!actorId) throw new Error('Unauthorized');
    const actor = await prisma.player.findUnique({ where: { id: actorId } });
    if (!actor || !actor.isClub) throw new Error('Only club accounts can employ coaches');

    return await prisma.staff.update({ where: { id: coachId }, data: { employedBy: { connect: { id: actorId } } } });
}

export async function unemployCoach(actorId: string | null, coachId: string) {
    if (!actorId) throw new Error('Unauthorized');
    const actor = await prisma.player.findUnique({ where: { id: actorId } });
    if (!actor || !actor.isClub) throw new Error('Only club accounts can unemploy coaches');

    return await prisma.staff.update({ where: { id: coachId }, data: { employedBy: { disconnect: true } } });
}

export async function createStaff(actorId: string | null, data: { name: string; role: string; expertise?: string; contact?: string; photo?: string }) {
    if (!actorId) throw new Error('Unauthorized');
    const actor = await prisma.player.findUnique({ where: { id: actorId } });
    if (!actor || !actor.isClub) throw new Error('Only club accounts can create staff');

    return await prisma.staff.create({ data: { name: data.name, role: data.role, expertise: data.expertise || null, contact: data.contact || null, photo: data.photo || null, employedBy: { connect: { id: actorId } } } });
}

export async function updateStaff(actorId: string | null, id: string, data: { name?: string; role?: string; expertise?: string; contact?: string; photo?: string }) {
    if (!actorId) throw new Error('Unauthorized');
    const actor = await prisma.player.findUnique({ where: { id: actorId } });
    if (!actor || !actor.isClub) throw new Error('Only club accounts can update staff');

    return await prisma.staff.update({
        where: { id }, data: {
            name: data.name,
            role: data.role,
            expertise: data.expertise === undefined ? undefined : data.expertise,
            contact: data.contact === undefined ? undefined : data.contact,
            photo: data.photo === undefined ? undefined : data.photo,
        }
    });
}

export async function deleteStaff(actorId: string | null, id: string) {
    if (!actorId) throw new Error('Unauthorized');
    const actor = await prisma.player.findUnique({ where: { id: actorId } });
    if (!actor || !actor.isClub) throw new Error('Only club accounts can delete staff');
    return await prisma.staff.delete({ where: { id } });
}
