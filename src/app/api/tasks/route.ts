import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(
      100,
      Math.max(1, Number.parseInt(searchParams.get("pageSize") || "10"))
    );

    const skip = (page - 1) * pageSize;

    const where = {
      userId: user.id,
      ...(q && {
        title: {
          contains: q,
          mode: "insensitive" as const,
        },
      }),
    };

    const total = await prisma.task.count({ where });
    const totalPages = Math.ceil(total / pageSize);

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ done: "asc" }, { createdAt: "desc" }],
      skip,
      take: pageSize,
    });

    return NextResponse.json({
      items: tasks,
      page,
      pageSize,
      total,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await request.json();

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required and cannot be empty" },
        { status: 400 }
      );
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length > 200) {
      return NextResponse.json(
        { error: "Title must be between 1-200 characters" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title: trimmedTitle,
        userId: user.id,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
