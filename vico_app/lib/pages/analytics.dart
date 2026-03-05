import 'package:flutter/material.dart';
import '../services/api_service.dart';

class AnalyticsPage extends StatefulWidget {
  const AnalyticsPage({super.key});

  @override
  State<AnalyticsPage> createState() => _AnalyticsPageState();
}

class _AnalyticsPageState extends State<AnalyticsPage> {
  final ApiService api = ApiService();
  late Future<Map<String, dynamic>> _analytics;
  String _timeRange = 'month';

  @override
  void initState() {
    super.initState();
    _analytics = api.getAnalytics(range: _timeRange).then((data) {
      if (data is Map) return data.cast<String, dynamic>();
      return {};
    });
  }

  void _updateTimeRange(String range) {
    setState(() {
      _timeRange = range;
      _analytics = api.getAnalytics(range: _timeRange).then((data) {
        if (data is Map) return data.cast<String, dynamic>();
        return {};
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFFAF5F0), Color(0xFFFBF5FF), Color(0xFFF5F3FF)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: FutureBuilder<Map<String, dynamic>>(
          future: _analytics,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return _buildLoadingState();
            }
            if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}'));
            }
            final data = snapshot.data ?? {};

            return SingleChildScrollView(
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHeader(),
                      SizedBox(height: 20),
                      _buildTimeRangeSelector(),
                      SizedBox(height: 20),
                      _buildMetricsCards(data),
                      SizedBox(height: 20),
                      _buildCharts(data),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8)]),
            child: Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation(Color(0xFF8B5CF6)))),
          ),
          SizedBox(height: 16),
          Text('Loading analytics...', style: TextStyle(color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: [Color(0xFF8B5CF6), Color(0xFFA78BFA)]),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.analytics, color: Colors.white, size: 16),
              SizedBox(width: 8),
              Text('Performance Metrics', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
        SizedBox(height: 12),
        Text('Analytics Dashboard', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.grey[900])),
        SizedBox(height: 8),
        Text('View performance metrics and insights', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
      ],
    );
  }

  Widget _buildTimeRangeSelector() {
    return Row(
      children: [
        _buildTimeButton('Week', 'week'),
        SizedBox(width: 8),
        _buildTimeButton('Month', 'month'),
        SizedBox(width: 8),
        _buildTimeButton('Year', 'year'),
      ],
    );
  }

  Widget _buildTimeButton(String label, String value) {
    final isActive = _timeRange == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => _updateTimeRange(value),
        child: Container(
          padding: EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            gradient: isActive ? LinearGradient(colors: [Color(0xFF8B5CF6), Color(0xFFA78BFA)]) : null,
            color: isActive ? null : Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: isActive ? null : Border.all(color: Color(0xFFEDE9FE)),
            boxShadow: [if (isActive) BoxShadow(color: Color(0xFF8B5CF6).withOpacity(0.3), blurRadius: 8)],
          ),
          child: Text(label, textAlign: TextAlign.center, style: TextStyle(color: isActive ? Colors.white : Colors.grey[700], fontWeight: FontWeight.bold, fontSize: 12)),
        ),
      ),
    );
  }

  Widget _buildMetricsCards(Map<String, dynamic> data) {
    return Column(
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Color(0xFFEDE9FE)),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 2)],
          ),
          padding: EdgeInsets.all(14),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: _buildMetricItem('Total Matches', data['totalMatches'] ?? 0, Color(0xFF8B5CF6)),
              ),
              SizedBox(width: 12),
              Expanded(
                child: _buildMetricItem('Total Players', data['totalPlayers'] ?? 0, Color(0xFFC084FC)),
              ),
            ],
          ),
        ),
        SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Color(0xFFEDE9FE)),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 2)],
          ),
          padding: EdgeInsets.all(14),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: _buildMetricItem('Avg Rating', '${data['avgRating'] ?? 0.0}', Color(0xFFEC4899)),
              ),
              SizedBox(width: 12),
              Expanded(
                child: _buildMetricItem('Win Rate', '${data['winRate'] ?? 0}%', Color(0xFF10B981)),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMetricItem(String label, dynamic value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[600], fontWeight: FontWeight.w500)),
        SizedBox(height: 6),
        Container(
          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text('$value', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: color)),
        ),
      ],
    );
  }

  Widget _buildCharts(Map<String, dynamic> data) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFEDE9FE)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 8)],
      ),
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Performance Overview', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          SizedBox(height: 16),
          Container(
            height: 200,
            decoration: BoxDecoration(
              color: Color(0xFFFAF5FF),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Color(0xFFEDE9FE)),
            ),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.show_chart, size: 48, color: Color(0xFFC084FC)),
                  SizedBox(height: 12),
                  Text('Chart visualization will appear here', style: TextStyle(color: Colors.grey[600])),
                ],
              ),
            ),
          ),
          SizedBox(height: 12),
          Text('Data is updated based on the selected time range', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
        ],
      ),
    );
  }
}
