const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['admin', 'member'], 
      default: 'member' 
    },
    // User Profile Information
    fullName: { type: String, default: '' },
    userType: { 
      type: String, 
      enum: ['student', 'professional'], 
      default: 'student' 
    },
    institutionOrCompany: { type: String, default: '' },
    branchOrDepartment: { type: String, default: '' },
    yearOrExperience: { type: String, default: '' },
    bio: { type: String, default: '' },
    githubUsername: { type: String, default: '' },
    skills: { type: [String], default: [] }
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.password;
  }
});

module.exports = mongoose.model('User', userSchema);
