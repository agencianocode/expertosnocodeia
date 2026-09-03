import { db } from './db';
import { adminTaskColumns, adminTasks, users, adminUsers } from '../shared/schema';
import { eq, asc, inArray, sql } from 'drizzle-orm';

const DEFAULT_COLUMNS: Array<{ name: string; color: string }> = [
  { name: 'Por hacer', color: '#94A3B8' },
  { name: 'En progreso', color: '#1978E5' },
  { name: 'En revisión', color: '#F59E0B' },
  { name: 'Hecho', color: '#22C55E' },
];

type TaskUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  profileImageUrl: string | null;
};

export type BoardTask = {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  priority: string;
  dueDate: Date | null;
  position: number;
  assignee: TaskUser | null;
  createdBy: TaskUser | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type BoardColumn = {
  id: string;
  name: string;
  color: string | null;
  position: number;
  tasks: BoardTask[];
};

/**
 * Make sure the board always has at least one column to work with.
 * Runs lazily the first time the board is requested.
 */
async function ensureDefaultColumns(): Promise<void> {
  const existing = await db.select({ id: adminTaskColumns.id }).from(adminTaskColumns).limit(1);
  if (existing.length > 0) return;

  await db.insert(adminTaskColumns).values(
    DEFAULT_COLUMNS.map((col, index) => ({
      name: col.name,
      color: col.color,
      position: index,
    }))
  );
}

/**
 * Fetch the full Kanban board: columns in order, each with its tasks in order,
 * with assignee/creator info resolved.
 */
export async function getBoard(): Promise<BoardColumn[]> {
  try {
    await ensureDefaultColumns();

    const columns = await db
      .select()
      .from(adminTaskColumns)
      .orderBy(asc(adminTaskColumns.position));

    const tasks = await db
      .select()
      .from(adminTasks)
      .orderBy(asc(adminTasks.position));

    const userIds = Array.from(
      new Set(
        tasks.flatMap((t) => [t.assigneeId, t.createdBy]).filter((id): id is string => !!id)
      )
    );

    const userMap = new Map<string, TaskUser>();
    if (userIds.length > 0) {
      const rows = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        })
        .from(users)
        .where(inArray(users.id, userIds));
      rows.forEach((u) => userMap.set(u.id, u));
    }

    const tasksByColumn = new Map<string, BoardTask[]>();
    for (const task of tasks) {
      const boardTask: BoardTask = {
        id: task.id,
        columnId: task.columnId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
        position: task.position,
        assignee: task.assigneeId ? userMap.get(task.assigneeId) || null : null,
        createdBy: task.createdBy ? userMap.get(task.createdBy) || null : null,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };
      const list = tasksByColumn.get(task.columnId) || [];
      list.push(boardTask);
      tasksByColumn.set(task.columnId, list);
    }

    return columns.map((col) => ({
      id: col.id,
      name: col.name,
      color: col.color,
      position: col.position,
      tasks: tasksByColumn.get(col.id) || [],
    }));
  } catch (error: any) {
    if (error.message?.includes('does not exist') || error.message?.includes('relation')) {
      console.warn('⚠️ Tablas admin_task_columns/admin_tasks no existen aún. Ejecuta db:push.');
      return [];
    }
    throw error;
  }
}

/** Admin users available to be assigned tasks (id, name, email). */
export async function getAssignableUsers(): Promise<TaskUser[]> {
  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      profileImageUrl: users.profileImageUrl,
    })
    .from(adminUsers)
    .innerJoin(users, eq(adminUsers.userId, users.id))
    .where(eq(adminUsers.isActive, true));

  return rows;
}

export async function createColumn(data: { name: string; color?: string }) {
  const [{ maxPosition } = { maxPosition: -1 }] = await db
    .select({ maxPosition: sql<number>`COALESCE(MAX(${adminTaskColumns.position}), -1)` })
    .from(adminTaskColumns);

  const [column] = await db
    .insert(adminTaskColumns)
    .values({
      name: data.name,
      color: data.color || '#1978E5',
      position: (maxPosition ?? -1) + 1,
    })
    .returning();

  return column;
}

export async function updateColumn(id: string, data: { name?: string; color?: string }) {
  const [column] = await db
    .update(adminTaskColumns)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(adminTaskColumns.id, id))
    .returning();

  return column;
}

export async function reorderColumns(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, index) =>
      db.update(adminTaskColumns).set({ position: index }).where(eq(adminTaskColumns.id, id))
    )
  );
}

export async function deleteColumn(id: string): Promise<void> {
  // Tasks in this column are removed via ON DELETE CASCADE
  await db.delete(adminTaskColumns).where(eq(adminTaskColumns.id, id));
}

export async function createTask(data: {
  columnId: string;
  title: string;
  description?: string | null;
  priority?: string;
  assigneeId?: string | null;
  dueDate?: Date | null;
  createdBy?: string | null;
}) {
  const [{ maxPosition } = { maxPosition: -1 }] = await db
    .select({ maxPosition: sql<number>`COALESCE(MAX(${adminTasks.position}), -1)` })
    .from(adminTasks)
    .where(eq(adminTasks.columnId, data.columnId));

  const [task] = await db
    .insert(adminTasks)
    .values({
      columnId: data.columnId,
      title: data.title,
      description: data.description ?? null,
      priority: data.priority || 'medium',
      assigneeId: data.assigneeId ?? null,
      dueDate: data.dueDate ?? null,
      createdBy: data.createdBy ?? null,
      position: (maxPosition ?? -1) + 1,
    })
    .returning();

  return task;
}

export async function updateTask(
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    priority: string;
    assigneeId: string | null;
    dueDate: Date | null;
  }>
) {
  const [task] = await db
    .update(adminTasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(adminTasks.id, id))
    .returning();

  return task;
}

/** Move a task to a (possibly different) column at a given position, reflowing both columns. */
export async function moveTask(id: string, columnId: string, position: number): Promise<void> {
  const [task] = await db.select().from(adminTasks).where(eq(adminTasks.id, id));
  if (!task) throw new Error('Tarea no encontrada');

  const sourceColumnId = task.columnId;

  // Pull the ordered task list of the destination column (excluding the task being moved)
  const destTasks = await db
    .select({ id: adminTasks.id })
    .from(adminTasks)
    .where(eq(adminTasks.columnId, columnId))
    .orderBy(asc(adminTasks.position));

  const destIds = destTasks.map((t) => t.id).filter((tid) => tid !== id);
  const clampedPosition = Math.max(0, Math.min(position, destIds.length));
  destIds.splice(clampedPosition, 0, id);

  await Promise.all(
    destIds.map((taskId, index) =>
      db
        .update(adminTasks)
        .set({
          position: index,
          columnId,
          updatedAt: new Date(),
        })
        .where(eq(adminTasks.id, taskId))
    )
  );

  // If the task moved out of its original column, reflow the remaining tasks there too
  if (sourceColumnId !== columnId) {
    const remaining = await db
      .select({ id: adminTasks.id })
      .from(adminTasks)
      .where(eq(adminTasks.columnId, sourceColumnId))
      .orderBy(asc(adminTasks.position));

    await Promise.all(
      remaining.map((t, index) =>
        db.update(adminTasks).set({ position: index }).where(eq(adminTasks.id, t.id))
      )
    );
  }
}

export async function deleteTask(id: string): Promise<void> {
  await db.delete(adminTasks).where(eq(adminTasks.id, id));
}
