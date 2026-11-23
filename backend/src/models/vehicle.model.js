import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  type: {
    type: String,
    required: true,
    trim: true,
    maxlength: 40,
  },
  plate: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 20,
    set: (value) => typeof value === 'string' ? value.replace(/\s+/g, '') : value,
  },
}, { timestamps: true, collection: 'vehicles' });

vehicleSchema.index({ plate: 1 }, { unique: true });

export const Vehicle = mongoose.model('Vehicle', vehicleSchema);
