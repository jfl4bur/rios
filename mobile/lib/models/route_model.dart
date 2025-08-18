class RouteModel {
  final int id;
  final String title;
  final String description;
  final double? lat;
  final double? lng;

  RouteModel({required this.id, required this.title, required this.description, this.lat, this.lng});

  factory RouteModel.fromJson(Map<String, dynamic> j) {
    return RouteModel(
      id: j['id'] is int ? j['id'] : int.tryParse(j['id']?.toString() ?? '0') ?? 0,
      title: j['title'] ?? j['nombre'] ?? 'Sin título',
      description: j['description'] ?? j['descripcion'] ?? '',
      lat: j['lat'] != null ? (j['lat'] as num).toDouble() : null,
      lng: j['lng'] != null ? (j['lng'] as num).toDouble() : null,
    );
  }
}
