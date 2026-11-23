import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  },
  operation: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  date: {
    type: Date,
    required: true,
  },
  mileage: {
    type: Number,
    required: true,
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
    validate: {
      validator: Number.isSafeInteger,
      message: 'El kilometraje debe ser un entero no negativo.',
    },
  },
  costInCents: {
    type: Number,
    required: true,
    min: 0,
    max: Number.MAX_SAFE_INTEGER,
    validate: {
      validator: Number.isSafeInteger,
      message: 'El coste debe ser un entero no negativo expresado en céntimos.',
    },
  },
}, { timestamps: true, collection: 'maintenances' });

maintenanceSchema.index({ date: -1 });
maintenanceSchema.index({ vehicle: 1, date: -1 });

export const Maintenance = mongoose.model('Maintenance', maintenanceSchema);
