import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

class AttendanceChartWidget extends StatelessWidget {
  final List<dynamic> attendance;

  const AttendanceChartWidget({super.key, required this.attendance});

  @override
  Widget build(BuildContext context) {
    // Group attendance by month for the chart
    final monthlyData = <String, Map<String, int>>{};

    for (final record in attendance) {
      final date = DateTime.parse(record['date']);
      final monthKey = '${date.year}-${date.month.toString().padLeft(2, '0')}';
      final monthName = '${_getMonthName(date.month)} ${date.year}';

      if (!monthlyData.containsKey(monthKey)) {
        monthlyData[monthKey] = {'present': 0, 'total': 0, 'monthName': monthName};
      }

      monthlyData[monthKey]!['total'] = (monthlyData[monthKey]!['total'] ?? 0) + 1;
      if (record['present'] == true) {
        monthlyData[monthKey]!['present'] = (monthlyData[monthKey]!['present'] ?? 0) + 1;
      }
    }

    final sortedMonths = monthlyData.keys.toList()..sort();
    final barGroups = <BarChartGroupData>[];

    for (int i = 0; i < sortedMonths.length; i++) {
      final month = sortedMonths[i];
      final data = monthlyData[month]!;
      final present = data['present'] ?? 0;
      final total = data['total'] ?? 1;
      final percentage = total > 0 ? (present / total) * 100 : 0;

      barGroups.add(
        BarChartGroupData(
          x: i,
          barRods: [
            BarChartRodData(
              toY: percentage,
              color: Colors.green,
              width: 20,
            ),
          ],
        ),
      );
    }

    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Attendance Chart',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            if (attendance.isEmpty)
              const Text('No attendance data available')
            else
              SizedBox(
                height: 200,
                child: BarChart(
                  BarChartData(
                    barGroups: barGroups,
                    titlesData: FlTitlesData(
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          getTitlesWidget: (value, meta) {
                            if (value.toInt() < sortedMonths.length) {
                              final monthKey = sortedMonths[value.toInt()];
                              final monthData = monthlyData[monthKey]!;
                              return Text(
                                monthData['monthName'].toString().substring(0, 3),
                                style: const TextStyle(fontSize: 10),
                              );
                            }
                            return const Text('');
                          },
                        ),
                      ),
                      leftTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          reservedSize: 30,
                          getTitlesWidget: (value, meta) {
                            return Text('${value.toInt()}%');
                          },
                        ),
                      ),
                      topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    ),
                    borderData: FlBorderData(show: false),
                    gridData: FlGridData(show: true),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _getMonthName(int month) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  }
}