import 'package:flutter/material.dart';

class EditProfileModal extends StatefulWidget {
  final Map<String, dynamic> editForm;
  final Function(String, String) onFieldChange;
  final VoidCallback onSave;
  final VoidCallback onCancel;

  const EditProfileModal({
    super.key,
    required this.editForm,
    required this.onFieldChange,
    required this.onSave,
    required this.onCancel,
  });

  @override
  State<EditProfileModal> createState() => _EditProfileModalState();
}

class _EditProfileModalState extends State<EditProfileModal> {
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _bioController;
  late TextEditingController _photoController;
  String? _gender;
  String? _nationality;
  DateTime? _dateOfBirth;

  @override
  void initState() {
    super.initState();
    _firstNameController = TextEditingController(text: widget.editForm['firstName']);
    _lastNameController = TextEditingController(text: widget.editForm['lastName']);
    _emailController = TextEditingController(text: widget.editForm['email']);
    _phoneController = TextEditingController(text: widget.editForm['phone']);
    _bioController = TextEditingController(text: widget.editForm['bio']);
    _photoController = TextEditingController(text: widget.editForm['photo']);
    _gender = widget.editForm['gender'];
    _nationality = widget.editForm['nationality'];

    if (widget.editForm['dateOfBirth'] != null && widget.editForm['dateOfBirth'].isNotEmpty) {
      _dateOfBirth = DateTime.parse(widget.editForm['dateOfBirth']);
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _bioController.dispose();
    _photoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        height: MediaQuery.of(context).size.height * 0.8,
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Text(
              'Edit Profile',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView(
                children: [
                  TextField(
                    controller: _firstNameController,
                    decoration: const InputDecoration(labelText: 'First Name'),
                    onChanged: (value) => widget.onFieldChange('firstName', value),
                  ),
                  TextField(
                    controller: _lastNameController,
                    decoration: const InputDecoration(labelText: 'Last Name'),
                    onChanged: (value) => widget.onFieldChange('lastName', value),
                  ),
                  TextField(
                    controller: _emailController,
                    decoration: const InputDecoration(labelText: 'Email'),
                    keyboardType: TextInputType.emailAddress,
                    onChanged: (value) => widget.onFieldChange('email', value),
                  ),
                  TextField(
                    controller: _phoneController,
                    decoration: const InputDecoration(labelText: 'Phone'),
                    keyboardType: TextInputType.phone,
                    onChanged: (value) => widget.onFieldChange('phone', value),
                  ),
                  DropdownButtonFormField<String>(
                    value: _gender,
                    decoration: const InputDecoration(labelText: 'Gender'),
                    items: ['Male', 'Female', 'Other'].map((gender) {
                      return DropdownMenuItem(value: gender, child: Text(gender));
                    }).toList(),
                    onChanged: (value) {
                      setState(() => _gender = value);
                      widget.onFieldChange('gender', value ?? '');
                    },
                  ),
                  TextField(
                    controller: _bioController,
                    decoration: const InputDecoration(labelText: 'Bio'),
                    maxLines: 3,
                    onChanged: (value) => widget.onFieldChange('bio', value),
                  ),
                  TextField(
                    controller: _photoController,
                    decoration: const InputDecoration(labelText: 'Photo URL'),
                    onChanged: (value) => widget.onFieldChange('photo', value),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: widget.onCancel,
                  child: const Text('Cancel'),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: widget.onSave,
                  child: const Text('Save'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}