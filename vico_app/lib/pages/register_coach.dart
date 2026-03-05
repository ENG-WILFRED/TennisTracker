import 'package:flutter/material.dart';
import '../services/api_service.dart';

class RegisterCoachPage extends StatefulWidget {
  const RegisterCoachPage({super.key});

  @override
  State<RegisterCoachPage> createState() => _RegisterCoachPageState();
}

class _RegisterCoachPageState extends State<RegisterCoachPage> {
  final ApiService api = ApiService();
  late Future<List<dynamic>> _coaches;
  bool _loading = false;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _coaches = api.fetchCoaches().then((list) {
      return list.where((c) => c['employedById'] == null).toList();
    });
  }

  Future<void> _employ(String coachId) async {
    setState(() => _loading = true);
    try {
      await api.post('/api/coaches/employ', {'coachId': coachId});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Coach employed successfully!')));
        setState(() {
          _coaches = api.fetchCoaches().then((list) {
            return list.where((c) => c['employedById'] == null).toList();
          });
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF0FDF4), Color(0xFFF0F9FF)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: FutureBuilder<List<dynamic>>(
          future: _coaches,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return _buildLoadingState();
            }
            if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}'));
            }
            final coaches = snapshot.data ?? [];
            final display = _search.isNotEmpty
                ? coaches.where((c) {
                    final name = '${c['firstName'] ?? c['name'] ?? ''} ${c['lastName'] ?? ''}'.toLowerCase();
                    return name.contains(_search.toLowerCase());
                  }).toList()
                : coaches;

            return SingleChildScrollView(
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHeader(),
                      SizedBox(height: 24),
                      if (coaches.isEmpty)
                        _buildEmptyState()
                      else
                        _buildCoachesContainer(coaches, display),
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
            child: Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation(Color(0xFF16A34A)))),
          ),
          SizedBox(height: 16),
          Text('Loading coaches...', style: TextStyle(color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Register Coaches', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.grey[900])),
        SizedBox(height: 8),
        Text('Select available coaches to employ with your organization', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Color(0xFFDCFCE7), width: 2),
      ),
      child: Column(
        children: [
          Icon(Icons.event_busy, size: 48, color: Color(0xFF86EFAC)),
          SizedBox(height: 16),
          Text('No available coaches', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey[900])),
          SizedBox(height: 8),
          Text('All coaches are already employed', style: TextStyle(fontSize: 14, color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildCoachesContainer(List<dynamic> allCoaches, List<dynamic> displayCoaches) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 8)],
        border: Border.all(color: Colors.grey[200]!),
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        children: [
          // Header
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [Color(0xFF16A34A), Color(0xFF059669)]),
            ),
            padding: EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Icons.badge, color: Colors.white, size: 24),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${allCoaches.length} coaches available for employment',
                              style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 14, fontWeight: FontWeight.w500)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                // Search Bar
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Search coaches...',
                    prefixIcon: Icon(Icons.search),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  ),
                  onChanged: (v) => setState(() => _search = v),
                ),
                SizedBox(height: 20),
                // Coaches List
                if (displayCoaches.isEmpty)
                  Center(child: Text('No coaches found', style: TextStyle(color: Colors.grey[600])))
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: NeverScrollableScrollPhysics(),
                    itemCount: displayCoaches.length,
                    separatorBuilder: (_, __) => SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final c = displayCoaches[index];
                      return _buildCoachItem(c);
                    },
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCoachItem(dynamic c) {
    final name = c['firstName'] != null ? '${c['firstName']} ${c['lastName'] ?? ''}' : c['name'] ?? 'Unknown';

    return Container(
      decoration: BoxDecoration(
        color: Color(0xFFF0FDF4),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(0xFFDCFCE7)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 2)],
      ),
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [Color(0xFF16A34A), Color(0xFF059669)]),
              shape: BoxShape.circle,
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4)],
            ),
            child: Center(
              child: Text(
                name[0].toUpperCase(),
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
          ),
          SizedBox(width: 12),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                SizedBox(height: 4),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    c['role'] ?? 'Coach',
                    style: TextStyle(fontSize: 11, color: Color(0xFF16A34A), fontWeight: FontWeight.w600),
                  ),
                ),
                if (c['experience'] != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text('${c['experience']}+ years experience', style: TextStyle(fontSize: 11, color: Colors.grey[600])),
                  ),
              ],
            ),
          ),
          SizedBox(width: 12),
          // Employ Button
          ElevatedButton(
            onPressed: _loading ? null : () => _employ(c['id'].toString()),
            style: ElevatedButton.styleFrom(
              backgroundColor: Color(0xFF16A34A),
              disabledBackgroundColor: Colors.grey[400],
              padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            child: _loading
                ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)))
                : Text('Employ', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}
