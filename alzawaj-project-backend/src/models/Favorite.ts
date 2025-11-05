import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  profileId: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
}

interface IFavoriteModel extends Model<IFavorite> {
  addFavorite(
    userId: mongoose.Types.ObjectId,
    profileId: mongoose.Types.ObjectId,
    notes?: string
  ): Promise<IFavorite>;
  removeFavorite(
    userId: mongoose.Types.ObjectId,
    profileId: mongoose.Types.ObjectId
  ): Promise<void>;
  isFavorite(
    userId: mongoose.Types.ObjectId,
    profileId: mongoose.Types.ObjectId
  ): Promise<boolean>;
  getUserFavorites(userId: mongoose.Types.ObjectId): Promise<IFavorite[]>;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    profileId: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
      index: true,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
// Unique constraint - user can only favorite a profile once
favoriteSchema.index({ userId: 1, profileId: 1 }, { unique: true });
// User's favorites list
favoriteSchema.index({ userId: 1, createdAt: -1 });

// Static methods
favoriteSchema.statics.addFavorite = async function (
  userId: mongoose.Types.ObjectId,
  profileId: mongoose.Types.ObjectId,
  notes?: string
): Promise<IFavorite> {
  const favorite = new this({
    userId,
    profileId,
    notes,
  });
  
  return favorite.save();
};

favoriteSchema.statics.removeFavorite = async function (
  userId: mongoose.Types.ObjectId,
  profileId: mongoose.Types.ObjectId
): Promise<void> {
  await this.deleteOne({ userId, profileId });
};

favoriteSchema.statics.isFavorite = async function (
  userId: mongoose.Types.ObjectId,
  profileId: mongoose.Types.ObjectId
): Promise<boolean> {
  const favorite = await this.findOne({ userId, profileId });
  return !!favorite;
};

favoriteSchema.statics.getUserFavorites = async function (
  userId: mongoose.Types.ObjectId
): Promise<IFavorite[]> {
  return this.find({ userId })
    .populate("profileId", "basicInfo name profilePicture location")
    .sort({ createdAt: -1 });
};

export const Favorite = mongoose.model<IFavorite, IFavoriteModel>("Favorite", favoriteSchema);
export default Favorite;