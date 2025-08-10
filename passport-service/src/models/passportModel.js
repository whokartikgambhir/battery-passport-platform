// external dependencies
import mongoose from 'mongoose';

const passportSchema = new mongoose.Schema({
  data: {
    generalInformation: {
      batteryIdentifier: { type: String, required: true },
      batteryModel: {
        id: { type: String, required: true },
        modelName: { type: String, required: true }
      },
      batteryMass: { type: Number, required: true },
      batteryCategory: { type: String, required: true },
      batteryStatus: { type: String, required: true },
      manufacturingDate: { type: Date, required: true },
      manufacturingPlace: { type: String, required: true },
      warrantyPeriod: { type: String, required: true },
      manufacturerInformation: {
        manufacturerName: { type: String, required: true },
        manufacturerIdentifier: { type: String, required: true }
      }
    },
    materialComposition: {
      batteryChemistry: { type: String, required: true },
      criticalRawMaterials: [{ type: String }],
      hazardousSubstances: [
        {
          substanceName: { type: String },
          chemicalFormula: { type: String },
          casNumber: { type: String }
        }
      ]
    },
    carbonFootprint: {
      totalCarbonFootprint: { type: Number, required: true },
      measurementUnit: { type: String, required: true },
      methodology: { type: String, required: true }
    }
  }
}, { timestamps: true });

export const Passport = mongoose.model('Passport', passportSchema);
