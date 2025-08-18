const Joi = require('joi');

const pointSchema = Joi.object({
  type: Joi.string().valid('Point').required(),
  coordinates: Joi.array().items(Joi.number()).length(2).required()
});

const lineStringSchema = Joi.object({
  type: Joi.string().valid('LineString').required(),
  coordinates: Joi.array().items(Joi.array().items(Joi.number()).min(2)).min(2).required()
});

const geometrySchema = Joi.alternatives().try(pointSchema, lineStringSchema);

const waypointSchema = Joi.object({ lat: Joi.number().required(), lng: Joi.number().required() });

const createRiosSchema = Joi.object({
  nombre: Joi.string().max(200).allow('', null),
  title: Joi.string().max(200).allow('', null),
  descripcion: Joi.string().max(2000).allow('', null),
  description: Joi.string().max(2000).allow('', null),
  categoria: Joi.string().max(100).allow('', null),
  dificultad: Joi.string().valid('facil', 'medio', 'dificil').default('medio'),
  duracion_estimada: Joi.number().integer().min(0).allow(null),
  geometry: geometrySchema.optional().allow(null),
  waypoints: Joi.array().items(waypointSchema).max(1000).optional(),
  multimedia: Joi.array().items(Joi.string().uri().allow(Joi.string())).max(1000).optional(),
  lat: Joi.number().optional(),
  lng: Joi.number().optional()
});

module.exports = { createRiosSchema };
