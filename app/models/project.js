// /models/Project.js

import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
    trim: true,
  },
  projectState: {
    type: String,
    enum: ['ongoing', 'completed', 'paused', 'cancelled'],
    default: 'ongoing',
  },
  projectDomain: {
    type: String,
    default: '',
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: false,
  },
}, { timestamps: true });

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

export default Project;
