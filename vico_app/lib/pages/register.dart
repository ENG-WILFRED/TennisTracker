import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config.dart';
import 'package:intl/intl.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _api = ApiService();

  String username = '';
  String email = '';
  String password = '';
  String firstName = '';
  String lastName = '';
  String gender = '';
  String dateOfBirth = '';
  String nationality = '';
  String bio = '';
  String phone = '';

  bool loading = false;
  String? error;
  bool success = false;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();
    setState(() {
      loading = true;
      error = null;
      success = false;
    });
    try {
      await _api.post('/api/auth/register', {
        'username': username,
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'gender': gender.isNotEmpty ? gender : null,
        'dateOfBirth': dateOfBirth.isNotEmpty ? dateOfBirth : null,
        'nationality': nationality.isNotEmpty ? nationality : null,
        'bio': bio.isNotEmpty ? bio : null,
        'phone': phone.isNotEmpty ? phone : null,
      });
      setState(() {
        success = true;
      });
      _formKey.currentState!.reset();
    } catch (e) {
      setState(() {
        error = e.toString();
      });
    } finally {
      setState(() {
        loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Register')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: Column(
              children: [
                // header image
                SizedBox(
                  height: 150,
                  child: Image.asset(
                    'assets/tennis.jpeg',
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const Icon(Icons.sports_tennis, size: 100),
                  ),
                ),
                const SizedBox(height: 20),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // account section
                          const Text('Account Credentials', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          TextFormField(
                            decoration: const InputDecoration(labelText: 'Username'),
                            onSaved: (v) => username = v?.trim() ?? '',
                            validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                          ),
                          TextFormField(
                            decoration: const InputDecoration(labelText: 'Email'),
                            keyboardType: TextInputType.emailAddress,
                            onSaved: (v) => email = v?.trim() ?? '',
                            validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                          ),
                          TextFormField(
                            decoration: const InputDecoration(labelText: 'Password'),
                            obscureText: true,
                            onSaved: (v) => password = v ?? '',
                            validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                          ),
                          const SizedBox(height: 16),
                          // personal section
                          const Text('Personal Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          TextFormField(
                            decoration: const InputDecoration(labelText: 'First Name'),
                            onSaved: (v) => firstName = v?.trim() ?? '',
                          ),
                          TextFormField(
                            decoration: const InputDecoration(labelText: 'Last Name'),
                            onSaved: (v) => lastName = v?.trim() ?? '',
                          ),
                          TextFormField(
                            decoration: const InputDecoration(labelText: 'Phone'),
                            keyboardType: TextInputType.phone,
                            onSaved: (v) => phone = v?.trim() ?? '',
                          ),
                          DropdownButtonFormField<String>(
                            decoration: const InputDecoration(labelText: 'Gender'),
                            items: const [
                              DropdownMenuItem(value: '', child: Text('Select')),
                              DropdownMenuItem(value: 'Male', child: Text('Male')),
                              DropdownMenuItem(value: 'Female', child: Text('Female')),
                              DropdownMenuItem(value: 'Other', child: Text('Other')),
                            ],
                            onChanged: (v) => gender = v ?? '',
                          ),
                          TextFormField(
                            decoration: const InputDecoration(labelText: 'Date of Birth'),
                            readOnly: true,
                            controller: TextEditingController(text: dateOfBirth),
                            onTap: () async {
                              final d = await showDatePicker(
                                context: context,
                                initialDate: DateTime(2000),
                                firstDate: DateTime(1900),
                                lastDate: DateTime.now(),
                              );
                              if (d != null) {
                                setState(() {
                                  dateOfBirth = DateFormat('yyyy-MM-dd').format(d);
                                });
                              }
                            },
                          ),
                          TextFormField(
                            decoration: const InputDecoration(labelText: 'Nationality'),
                            onSaved: (v) => nationality = v?.trim() ?? '',
                          ),
                          TextFormField(
                            decoration: const InputDecoration(labelText: 'Bio'),
                            maxLines: 3,
                            onSaved: (v) => bio = v?.trim() ?? '',
                          ),
                          const SizedBox(height: 20),
                          if (error != null)
                            Text(error!, style: const TextStyle(color: Colors.red)),
                          if (success)
                            const Text('Registration successful!', style: TextStyle(color: Colors.green)),
                          const SizedBox(height: 8),
                          ElevatedButton(
                            onPressed: loading ? null : _submit,
                            child: loading ? const CircularProgressIndicator(color: Colors.white) : const Text('Create Account'),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
