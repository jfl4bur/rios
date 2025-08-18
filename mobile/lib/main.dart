import 'package:flutter/material.dart';
import 'screens/list_screen.dart';

void main() => runApp(MyApp());

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rutas & Ríos',
      theme: ThemeData(primarySwatch: Colors.green),
      home: RutasListScreen(),
    );
  }
}
