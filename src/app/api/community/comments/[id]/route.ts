import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;

    // Delete comment
    const comment = await prisma.postComment.delete({
      where: { id: commentId },
      include: { post: true },
    });

    console.log('💬 Comment deleted:', commentId);

    return NextResponse.json(
      { success: true, message: 'Comment deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('💬 Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
