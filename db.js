import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://fbmcoob:0zyAu5wF17v0Cg9K@cluster0.d0o0c0d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
