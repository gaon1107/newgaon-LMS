import 'package:flutter/material.dart';
import 'package:dio/dio.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LMS 통합 테스트 앱',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const LMSTestPage(title: 'LMS 통합 테스트'),
    );
  }
}

class LMSTestPage extends StatefulWidget {
  const LMSTestPage({super.key, required this.title});

  final String title;

  @override
  State<LMSTestPage> createState() => _LMSTestPageState();
}

class _LMSTestPageState extends State<LMSTestPage> {
  String _serverStatus = '연결 확인 중...';
  String _apiResponse = '';
  bool _isLoading = false;

  // 백엔드 서버 주소 (PC의 실제 IP)
  final String _baseUrl = 'http://192.168.0.17:5000';
  final Dio _dio = Dio();

  @override
  void initState() {
    super.initState();
    _checkServerConnection();
  }

  Future<void> _checkServerConnection() async {
    setState(() {
      _isLoading = true;
      _serverStatus = '서버 연결 확인 중...';
    });

    try {
      final response = await _dio.get('$_baseUrl/health');
      if (response.statusCode == 200) {
        setState(() {
          _serverStatus = '✅ 서버 연결 성공';
          _apiResponse = response.data.toString();
        });
      }
    } catch (e) {
      setState(() {
        _serverStatus = '❌ 서버 연결 실패: $e';
        _apiResponse = '';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _testLegacyAPI() async {
    setState(() {
      _isLoading = true;
      _apiResponse = 'Legacy API 테스트 중...';
    });

    try {
      final response = await _dio.get('$_baseUrl/api/d/1.0/test');
      setState(() {
        _apiResponse = 'Legacy API 응답:\n${response.data}';
      });
    } catch (e) {
      setState(() {
        _apiResponse = 'Legacy API 오류: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '서버 연결 상태',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(_serverStatus),
                    const SizedBox(height: 8),
                    Text('서버 주소: $_baseUrl'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _checkServerConnection,
                    child: const Text('서버 연결 확인'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _testLegacyAPI,
                    child: const Text('Legacy API 테스트'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Expanded(
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'API 응답',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      Expanded(
                        child: SingleChildScrollView(
                          child: Text(
                            _apiResponse.isEmpty ? '아직 API 응답이 없습니다.' : _apiResponse,
                            style: const TextStyle(fontFamily: 'monospace'),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (_isLoading)
              const LinearProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
