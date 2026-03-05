import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final AuthService _auth = AuthService();
  final ApiService _api = ApiService();

  final Map<String, TextEditingController> _controllers = {
    'username': TextEditingController(),
    'email': TextEditingController(),
    'password': TextEditingController(),
    'firstName': TextEditingController(),
    'lastName': TextEditingController(),
    'phone': TextEditingController(),
    'bio': TextEditingController(),
    'nationality': TextEditingController(),
    'dateOfBirth': TextEditingController(),
  };

  String? _gender;
  String? _nationality;
  DateTime? _dateOfBirth;
  bool _loading = false;
  String? _error;
  bool _success = false;
  bool _isHovered = false;

  @override
  void dispose() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _loading = true;
      _error = null;
      _success = false;
    });

    try {
      final formData = {
        'username': _controllers['username']!.text,
        'email': _controllers['email']!.text,
        'password': _controllers['password']!.text,
        'firstName': _controllers['firstName']!.text,
        'lastName': _controllers['lastName']!.text,
        'gender': _gender,
        'dateOfBirth': _dateOfBirth?.toIso8601String().split('T')[0],
        'nationality': _nationality,
        'bio': _controllers['bio']!.text,
        'phone': _controllers['phone']!.text,
      };

      // Call register API
      final response = await _api.post('/api/auth/register', formData);
      setState(() => _success = true);

      // Clear form
      _formKey.currentState!.reset();
      for (final controller in _controllers.values) {
        controller.clear();
      }
      _gender = null;
      _nationality = null;
      _dateOfBirth = null;

      // Show success message and navigate to login
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Registration successful! Please login.')),
      );

      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          Navigator.pushReplacementNamed(context, '/login');
        }
      });

    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_success) {
      return Scaffold(
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFFF0FFFE), Color(0xFFF0F9F8)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Center(
            child: Card(
              elevation: 8,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
              child: Padding(
                padding: const EdgeInsets.all(32.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF16A34A).withAlpha(51),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.check_circle,
                        color: Color(0xFF16A34A),
                        size: 56,
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Registration Successful! 🎾',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF16A34A),
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Welcome to Vico',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.grey,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF16A34A),
                        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('Go to Login', style: TextStyle(color: Colors.white)),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFFF0FFFE), Color(0xFFF0F9F8)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 900),
              child: Column(
                children: [
                  // Header Card
                  Card(
                    elevation: 4,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        children: [
                          MouseRegion(
                            onEnter: (_) => setState(() => _isHovered = true),
                            onExit: (_) => setState(() => _isHovered = false),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              width: 100,
                              height: 100,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF16A34A).withAlpha(51),
                                    blurRadius: _isHovered ? 16 : 8,
                                    spreadRadius: _isHovered ? 4 : 0,
                                  )
                                ],
                              ),
                              transform: _isHovered
                                  ? (Matrix4.identity()..scale(1.05))
                                  : Matrix4.identity(),
                              child: Container(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(16),
                                  image: const DecorationImage(
                                    image: AssetImage('assets/tennis.jpeg'),
                                    fit: BoxFit.cover,
                                  ),
                                  border: Border.all(
                                    color: Colors.white,
                                    width: 4,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),
                          const Text(
                            'Join Vico',
                            style: TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF16A34A),
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Create your account and start competing today',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.grey,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Wrap(
                            spacing: 12,
                            runSpacing: 8,
                            alignment: WrapAlignment.center,
                            children: [
                              _buildBenefitBadge('🎯 Free to join'),
                              _buildBenefitBadge('📊 Track performance'),
                              _buildBenefitBadge('👥 Connect with players'),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Form Card
                  Card(
                    elevation: 4,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(32.0),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Account Credentials Section
                            _buildSectionHeader(
                              Icons.lock,
                              'Account Credentials',
                              'Your login information',
                              Color(0xFF16A34A),
                              Color(0xFF0D9488),
                            ),
                            const SizedBox(height: 20),
                            _buildFormGrid([
                              _buildTextField(
                                controller: _controllers['username']!,
                                label: 'Username',
                                icon: Icons.person,
                                required: true,
                                placeholder: 'Choose a username',
                              ),
                              _buildTextField(
                                controller: _controllers['email']!,
                                label: 'Email',
                                icon: Icons.mail_outline,
                                keyboardType: TextInputType.emailAddress,
                                required: true,
                                placeholder: 'your.email@example.com',
                              ),
                              _buildTextField(
                                controller: _controllers['password']!,
                                label: 'Password',
                                icon: Icons.lock_outline,
                                obscureText: true,
                                required: true,
                                placeholder: 'Min. 8 characters',
                              ),
                            ]),

                            const SizedBox(height: 32),

                            // Personal Information Section
                            _buildSectionHeader(
                              Icons.person_outline,
                              'Personal Details',
                              'Tell us about yourself',
                              Color(0xFF3B82F6),
                              Color(0xFF0891B2),
                            ),
                            const SizedBox(height: 20),
                            _buildFormGrid([
                              _buildTextField(
                                controller: _controllers['firstName']!,
                                label: 'First Name',
                                icon: Icons.person,
                                required: true,
                                placeholder: 'John',
                              ),
                              _buildTextField(
                                controller: _controllers['lastName']!,
                                label: 'Last Name',
                                icon: Icons.person,
                                required: true,
                                placeholder: 'Doe',
                              ),
                              _buildTextField(
                                controller: _controllers['phone']!,
                                label: 'Phone Number',
                                icon: Icons.phone_outlined,
                                placeholder: '+254 700 000000',
                              ),
                            ]),
                            const SizedBox(height: 16),
                            _buildFormGrid([
                              _buildGenderDropdown(),
                              _buildTextField(
                                controller: _controllers['dateOfBirth']!,
                                label: 'Date of Birth',
                                icon: Icons.calendar_today,
                                placeholder: 'YYYY-MM-DD',
                              ),
                              _buildTextField(
                                controller: _controllers['nationality']!,
                                label: 'Nationality',
                                icon: Icons.public,
                                placeholder: 'e.g., Kenyan',
                              ),
                            ]),

                            const SizedBox(height: 32),

                            // Bio Section
                            _buildSectionHeader(
                              Icons.description_outlined,
                              'About You',
                              'Share your tennis journey',
                              Color(0xFFA855F7),
                              Color(0xFFEC4899),
                            ),
                            const SizedBox(height: 20),
                            _buildTextField(
                              controller: _controllers['bio']!,
                              label: 'Bio',
                              icon: Icons.description_outlined,
                              maxLines: 4,
                              placeholder: 'Tell us about your tennis experience, playing style, and goals...',
                            ),

                            const SizedBox(height: 32),

                            // Error Message
                            if (_error != null) ...[
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.red[50],
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.red[200]!),
                                ),
                                child: Row(
                                  children: [
                                    Icon(Icons.error_outline, color: Colors.red[600],),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        _error!,
                                        style: TextStyle(
                                          color: Colors.red[700],
                                          fontSize: 14,
                                        ),
                                      ),
                                    )
                                  ],
                                ),
                              ),
                              const SizedBox(height: 24),
                            ],

                            // Submit Button
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _loading ? null : _submit,
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  backgroundColor: const Color(0xFF16A34A),
                                  foregroundColor: Colors.white,
                                ),
                                child: _loading
                                    ? const SizedBox(
                                        height: 24,
                                        width: 24,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2.5,
                                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                        ),
                                      )
                                    : const Text(
                                        'Create Account',
                                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                                      ),
                              ),
                            ),
                            const SizedBox(height: 20),

                            // Login Link
                            Center(
                              child: Wrap(
                                alignment: WrapAlignment.center,
                                children: [
                                  const Text(
                                    'Already have an account? ',
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                  TextButton(
                                    onPressed: () => Navigator.pushNamed(context, '/login'),
                                    child: const Text(
                                      'Login here',
                                      style: TextStyle(
                                        color: Color(0xFF16A34A),
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Footer
                  Text(
                    '© ${DateTime.now().year} Vico. All rights reserved.',
                    style: const TextStyle(
                      color: Colors.grey,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(
    IconData icon,
    String title,
    String subtitle,
    Color color1,
    Color color2,
  ) {
    return Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [color1, color2],
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: Colors.white, size: 22),
        ),
        const SizedBox(width: 16),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            Text(
              subtitle,
              style: const TextStyle(
                color: Colors.grey,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildFormGrid(List<Widget> fields) {
    // Responsive grid based on screen size
    final isSmall = MediaQuery.of(context).size.width < 600;
    final crossAxisCount = isSmall ? 1 : (fields.length > 2 ? 3 : 2);
    
    return Wrap(
      spacing: 16,
      runSpacing: 16,
      children: fields.map((field) {
        return SizedBox(
          width: (MediaQuery.of(context).size.width - 64) / crossAxisCount - 11,
          child: field,
        );
      }).toList(),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool required = false,
    bool obscureText = false,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    String placeholder = '',
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 18, color: const Color(0xFF16A34A)),
            const SizedBox(width: 8),
            Text(
              required ? '$label *' : label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: const TextStyle(color: Colors.grey),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Colors.grey, width: 1),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Colors.grey, width: 1),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFF16A34A), width: 2),
            ),
            filled: true,
            fillColor: Colors.grey[50],
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
          obscureText: obscureText,
          keyboardType: keyboardType,
          maxLines: obscureText ? 1 : maxLines,
          validator: required
              ? (value) => (value == null || value.isEmpty) ? 'Required' : null
              : null,
        ),
      ],
    );
  }

  Widget _buildGenderDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.wc, size: 18, color: Color(0xFF16A34A)),
            const SizedBox(width: 8),
            const Text(
              'Gender',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: _gender,
          decoration: InputDecoration(
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Colors.grey, width: 1),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Colors.grey, width: 1),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFF16A34A), width: 2),
            ),
            filled: true,
            fillColor: Colors.grey[50],
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
          items: const [
            DropdownMenuItem(value: null, child: Text('Select gender')),
            DropdownMenuItem(value: 'Male', child: Text('Male')),
            DropdownMenuItem(value: 'Female', child: Text('Female')),
            DropdownMenuItem(value: 'Other', child: Text('Other')),
          ],
          onChanged: (value) => setState(() => _gender = value),
        ),
      ],
    );
  }

  Widget _buildBenefitBadge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF16A34A).withAlpha(25),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF16A34A).withAlpha(102)),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xFF16A34A),
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
