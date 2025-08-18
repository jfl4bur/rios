import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/route_model.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:9000';

  Future<List<RouteModel>> fetchRoutes() async {
    try {
      final resp = await http.get(Uri.parse('$baseUrl/api/rios')).timeout(Duration(seconds: 5));
      if (resp.statusCode == 200) {
        final List data = json.decode(resp.body) as List;
        return data.map((e) => RouteModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      // fallthrough to demo data
    }
    // Fallback demo routes
    return [
      RouteModel(id: 1, title: 'Demo: Río Claro', description: 'Ruta demo cerca del río', lat: 40.0, lng: -3.0),
      RouteModel(id: 2, title: 'Demo: Sendero Verde', description: 'Pequeña ruta de ejemplo', lat: 40.1, lng: -3.1),
    ];
  }

  /// Upload a single image to backend `/api/multimedia` endpoint.
  /// Returns the public URL string on success or null on failure.
  Future<String?> uploadImage(File imageFile) async {
    try {
      final uri = Uri.parse('$baseUrl/api/multimedia');
      final request = http.MultipartRequest('POST', uri);
      final stream = http.ByteStream(imageFile.openRead());
      final length = await imageFile.length();
      final multipartFile = http.MultipartFile('file', stream, length, filename: imageFile.path.split(Platform.pathSeparator).last);
      request.files.add(multipartFile);
      final resp = await request.send();
      final body = await resp.stream.bytesToString();
      if (resp.statusCode == 200 || resp.statusCode == 201) {
        final data = json.decode(body);
        // assume backend returns { url: 'https://...' }
        return data['url'] ?? data['fileUrl'] ?? null;
      }
    } catch (e) {
      // ignore and return null
    }
    return null;
  }

  /// Create a route. If [imageFiles] provided, uploads them first and includes returned URLs in `multimedia`.
  Future<bool> createRoute({required String title, String? description, double? lat, double? lng, String? categoria, String? dificultad, int? duracionEstimada, List<File>? imageFiles, List<Map<String, double>>? waypoints}) async {
    try {
      final multimedia = <String>[];
      if (imageFiles != null) {
        for (var f in imageFiles) {
          final url = await uploadImage(f);
          if (url != null) multimedia.add(url);
        }
      }
      final payload = {
        'title': title,
        'description': description ?? '',
        'lat': lat,
        'lng': lng,
        'waypoints': waypoints,
        // GeoJSON geometry: LineString if waypoints > 1, Point otherwise
        'geometry': (() {
          try {
            if (waypoints != null && waypoints.length > 1) {
              return {
                'type': 'LineString',
                'coordinates': waypoints.map((w) => [w['lng'], w['lat']]).toList()
              };
            } else if (lat != null && lng != null) {
              return {
                'type': 'Point',
                'coordinates': [lng, lat]
              };
            }
          } catch (e) {}
          return null;
        })(),
        'categoria': categoria ?? 'general',
        'dificultad': dificultad ?? 'medio',
        'duracion_estimada': duracionEstimada ?? 60,
        'multimedia': multimedia,
      };
      final resp = await http.post(Uri.parse('$baseUrl/api/rios'), headers: {'Content-Type': 'application/json'}, body: json.encode(payload)).timeout(Duration(seconds: 8));
      return resp.statusCode == 200 || resp.statusCode == 201;
    } catch (e) {
      return false;
    }
  }
}
