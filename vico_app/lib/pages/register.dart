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
              colors: [Color(0xFFe0f7fa), Color(0xFFa5d6a7)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Center(
            child: Card(
              elevation: 8,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.check_circle,
                      color: Colors.green,
                      size: 64,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Registration Successful!',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Please login with your credentials',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
                      child: const Text('Go to Login'),
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
            colors: [Color(0xFFe0f7fa), Color(0xFFa5d6a7)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 600),
              child: Card(
                elevation: 8,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Header
                      MouseRegion(
                        onEnter: (_) => setState(() => _isHovered = true),
                        onExit: (_) => setState(() => _isHovered = false),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            image: const DecorationImage(
                              image: AssetImage('assets/tennis_ball.png'),
                              fit: BoxFit.cover,
                            ),
                            boxShadow: _isHovered
                                ? [const BoxShadow(color: Colors.black26, blurRadius: 8, spreadRadius: 2)]
                                : [const BoxShadow(color: Colors.black12, blurRadius: 4)],
                          ),
                          transform: _isHovered
                              ? Matrix4.rotationZ(0.1)..scale(1.1)
                              : Matrix4.rotationZ(0.0)..scale(1.0),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Join Vico',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
                        ),
                      ),
                      const Text(
                        'Create your account and start competing today',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 24),

                      // Form
                      Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Account Credentials Section
                            _buildSectionHeader(
                              Icons.lock,
                              'Account Credentials',
                              'Your login information',
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildTextField(
                                    controller: _controllers['username']!,
                                    label: 'Username',
                                    icon: Icons.person,
                                    required: true,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _buildTextField(
                                    controller: _controllers['email']!,
                                    label: 'Email',
                                    icon: Icons.email,
                                    keyboardType: TextInputType.emailAddress,
                                    required: true,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            _buildTextField(
                              controller: _controllers['password']!,
                              label: 'Password',
                              icon: Icons.lock,
                              obscureText: true,
                              required: true,
                            ),

                            const SizedBox(height: 24),

                            // Personal Information Section
                            _buildSectionHeader(
                              Icons.person,
                              'Personal Information',
                              'Tell us about yourself',
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildTextField(
                                    controller: _controllers['firstName']!,
                                    label: 'First Name',
                                    icon: Icons.person_outline,
                                    required: true,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _buildTextField(
                                    controller: _controllers['lastName']!,
                                    label: 'Last Name',
                                    icon: Icons.person_outline,
                                    required: true,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: DropdownButtonFormField<String>(
                                    value: _gender,
                                    decoration: const InputDecoration(
                                      labelText: 'Gender',
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.all(Radius.circular(8)),
                                      ),
                                      prefixIcon: Icon(Icons.wc),
                                    ),
                                    items: ['Male', 'Female', 'Other'].map((gender) {
                                      return DropdownMenuItem(value: gender, child: Text(gender));
                                    }).toList(),
                                    onChanged: (value) => setState(() => _gender = value),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _buildTextField(
                                    controller: _controllers['phone']!,
                                    label: 'Phone',
                                    icon: Icons.phone,
                                    keyboardType: TextInputType.phone,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            _buildTextField(
                              controller: _controllers['bio']!,
                              label: 'Bio',
                              icon: Icons.description,
                              maxLines: 3,
                            ),

                            const SizedBox(height: 24),

                            // Error Message
                            if (_error != null)
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.red[50],
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: Colors.red[200]!),
                                ),
                                child: Text(
                                  _error!,
                                  style: const TextStyle(color: Colors.red),
                                  textAlign: TextAlign.center,
                                ),
                              ),

                            const SizedBox(height: 24),

                            // Submit Button
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _loading ? null : _submit,
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  backgroundColor: Colors.green,
                                  foregroundColor: Colors.white,
                                ),
                                child: _loading
                                    ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                        ),
                                      )
                                    : const Text('Create Account', style: TextStyle(fontSize: 16)),
                              ),
                            ),

                            const SizedBox(height: 16),

                            // Login Link
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Text('Already have an account? '),
                                TextButton(
                                  onPressed: () => Navigator.pushNamed(context, '/login'),
                                  child: const Text(
                                    'Login here',
                                    style: TextStyle(
                                      color: Colors.green,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        child: const Text(
          '© 2026 Vico',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(IconData icon, String title, String subtitle) {
    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.green, Colors.teal],
            ),
            borderRadius: BorderRadius.all(Radius.circular(8)),
          ),
          child: Icon(icon, color: Colors.white),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              subtitle,
              style: const TextStyle(
                color: Colors.grey,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ],
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
  }) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: required ? '$label *' : label,
        border: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(8)),
        ),
        prefixIcon: Icon(icon),
      ),
      obscureText: obscureText,
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator: required
          ? (value) => (value == null || value.isEmpty) ? 'Required' : null
          : null,
    );
  }
}
