import {
  users,
  posts,
  videos,
  comments,
  type User,
  type UpsertUser,
  type Post,
  type InsertPost,
  type Video,
  type InsertVideo,
  type Comment,
  type InsertComment,
  type PostWithAuthor,
  type VideoWithAuthor,
  type CommentWithAuthor,
} from "@shared/schema";
const { db } = require('./db');
const { eq, desc, and, or, ilike } = require('drizzle-orm');

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Post operations
  getPosts(limit?: number, offset?: number): Promise<PostWithAuthor[]>;
  getPostsByCategory(category: string, limit?: number, offset?: number): Promise<PostWithAuthor[]>;
  getPost(id: string): Promise<PostWithAuthor | undefined>;
  getPostsByAuthor(authorId: string): Promise<PostWithAuthor[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, post: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: string): Promise<boolean>;
  searchPosts(query: string): Promise<PostWithAuthor[]>;
  
  // Video operations
  getVideos(limit?: number, offset?: number): Promise<VideoWithAuthor[]>;
  getVideosByCategory(category: string, limit?: number, offset?: number): Promise<VideoWithAuthor[]>;
  getVideo(id: string): Promise<VideoWithAuthor | undefined>;
  getVideosByAuthor(authorId: string): Promise<VideoWithAuthor[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, video: Partial<InsertVideo>): Promise<Video | undefined>;
  deleteVideo(id: string): Promise<boolean>;
  searchVideos(query: string): Promise<VideoWithAuthor[]>;
  
  // Comment operations
  getCommentsByPost(postId: string): Promise<CommentWithAuthor[]>;
  getCommentsByVideo(videoId: string): Promise<CommentWithAuthor[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Post operations
  async getPosts(limit = 20, offset = 0): Promise<PostWithAuthor[]> {
    return await db
      .select()
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset)
      .then(rows => rows.map(row => ({
        ...row.posts,
        author: row.users!,
      })));
  }

  async getPostsByCategory(category: string, limit = 20, offset = 0): Promise<PostWithAuthor[]> {
    return await db
      .select()
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(and(eq(posts.published, true), eq(posts.category, category)))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset)
      .then(rows => rows.map(row => ({
        ...row.posts,
        author: row.users!,
      })));
  }

  async getPost(id: string): Promise<PostWithAuthor | undefined> {
    const result = await db
      .select()
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, id));
    
    if (result.length === 0) return undefined;
    
    const row = result[0];
    return {
      ...row.posts,
      author: row.users!,
    };
  }

  async getPostsByAuthor(authorId: string): Promise<PostWithAuthor[]> {
    return await db
      .select()
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.authorId, authorId))
      .orderBy(desc(posts.createdAt))
      .then(rows => rows.map(row => ({
        ...row.posts,
        author: row.users!,
      })));
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    return newPost;
  }

  async updatePost(id: string, post: Partial<InsertPost>): Promise<Post | undefined> {
    const [updatedPost] = await db
      .update(posts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async searchPosts(query: string): Promise<PostWithAuthor[]> {
    return await db
      .select()
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(
        and(
          eq(posts.published, true),
          or(
            ilike(posts.title, `%${query}%`),
            ilike(posts.content, `%${query}%`),
            ilike(posts.excerpt, `%${query}%`)
          )
        )
      )
      .orderBy(desc(posts.createdAt))
      .then(rows => rows.map(row => ({
        ...row.posts,
        author: row.users!,
      })));
  }

  // Video operations
  async getVideos(limit = 20, offset = 0): Promise<VideoWithAuthor[]> {
    return await db
      .select()
      .from(videos)
      .leftJoin(users, eq(videos.authorId, users.id))
      .where(eq(videos.published, true))
      .orderBy(desc(videos.createdAt))
      .limit(limit)
      .offset(offset)
      .then(rows => rows.map(row => ({
        ...row.videos,
        author: row.users!,
      })));
  }

  async getVideosByCategory(category: string, limit = 20, offset = 0): Promise<VideoWithAuthor[]> {
    return await db
      .select()
      .from(videos)
      .leftJoin(users, eq(videos.authorId, users.id))
      .where(and(eq(videos.published, true), eq(videos.category, category)))
      .orderBy(desc(videos.createdAt))
      .limit(limit)
      .offset(offset)
      .then(rows => rows.map(row => ({
        ...row.videos,
        author: row.users!,
      })));
  }

  async getVideo(id: string): Promise<VideoWithAuthor | undefined> {
    const result = await db
      .select()
      .from(videos)
      .leftJoin(users, eq(videos.authorId, users.id))
      .where(eq(videos.id, id));
    
    if (result.length === 0) return undefined;
    
    const row = result[0];
    return {
      ...row.videos,
      author: row.users!,
    };
  }

  async getVideosByAuthor(authorId: string): Promise<VideoWithAuthor[]> {
    return await db
      .select()
      .from(videos)
      .leftJoin(users, eq(videos.authorId, users.id))
      .where(eq(videos.authorId, authorId))
      .orderBy(desc(videos.createdAt))
      .then(rows => rows.map(row => ({
        ...row.videos,
        author: row.users!,
      })));
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    const [newVideo] = await db.insert(videos).values(video).returning();
    return newVideo;
  }

  async updateVideo(id: string, video: Partial<InsertVideo>): Promise<Video | undefined> {
    const [updatedVideo] = await db
      .update(videos)
      .set({ ...video, updatedAt: new Date() })
      .where(eq(videos.id, id))
      .returning();
    return updatedVideo;
  }

  async deleteVideo(id: string): Promise<boolean> {
    const result = await db.delete(videos).where(eq(videos.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async searchVideos(query: string): Promise<VideoWithAuthor[]> {
    return await db
      .select()
      .from(videos)
      .leftJoin(users, eq(videos.authorId, users.id))
      .where(
        and(
          eq(videos.published, true),
          or(
            ilike(videos.title, `%${query}%`),
            ilike(videos.description, `%${query}%`)
          )
        )
      )
      .orderBy(desc(videos.createdAt))
      .then(rows => rows.map(row => ({
        ...row.videos,
        author: row.users!,
      })));
  }

  // Comment operations
  async getCommentsByPost(postId: string): Promise<CommentWithAuthor[]> {
    return await db
      .select()
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt))
      .then(rows => rows.map(row => ({
        ...row.comments,
        author: row.users!,
      })));
  }

  async getCommentsByVideo(videoId: string): Promise<CommentWithAuthor[]> {
    return await db
      .select()
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.videoId, videoId))
      .orderBy(desc(comments.createdAt))
      .then(rows => rows.map(row => ({
        ...row.comments,
        author: row.users!,
      })));
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async deleteComment(id: string): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
