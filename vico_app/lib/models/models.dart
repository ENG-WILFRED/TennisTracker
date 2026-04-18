class Player {
  final String id;
  final String name;
  final String username;
  final String email;
  final int wins;
  final int matchesPlayed;
  final String level;
  final String nationality;
  final String? img;

  Player({
    required this.id,
    required this.name,
    required this.username,
    required this.email,
    required this.wins,
    required this.matchesPlayed,
    required this.level,
    required this.nationality,
    this.img,
  });

  factory Player.fromJson(Map<String, dynamic> json) {
    return Player(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Unknown',
      username: json['username'] as String? ?? '',
      email: json['email'] as String? ?? '',
      wins: json['wins'] as int? ?? 0,
      matchesPlayed: json['matchesPlayed'] as int? ?? 0,
      level: json['level'] as String? ?? 'Beginner',
      nationality: json['nationality'] as String? ?? '',
      img: json['img'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'username': username,
    'email': email,
    'wins': wins,
    'matchesPlayed': matchesPlayed,
    'level': level,
    'nationality': nationality,
    'img': img,
  };
}

class Coach {
  final String id;
  final String name;
  final String expertise;
  final String role;
  final String? photo;
  final int studentCount;

  Coach({
    required this.id,
    required this.name,
    required this.expertise,
    required this.role,
    this.photo,
    required this.studentCount,
  });

  factory Coach.fromJson(Map<String, dynamic> json) {
    return Coach(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Unknown',
      expertise: json['expertise'] as String? ?? '',
      role: json['role'] as String? ?? 'Coach',
      photo: json['photo'] as String?,
      studentCount: json['studentCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'expertise': expertise,
    'role': role,
    'photo': photo,
    'studentCount': studentCount,
  };
}

class Match {
  final String id;
  final DateTime date;
  final MatchPlayer playerA;
  final MatchPlayer playerB;
  final String status; // PENDING, COMPLETED, CANCELLED
  final String score;
  final MatchPlayer? winner;

  Match({
    required this.id,
    required this.date,
    required this.playerA,
    required this.playerB,
    required this.status,
    required this.score,
    this.winner,
  });

  factory Match.fromJson(Map<String, dynamic> json) {
    return Match(
      id: json['id'] as String? ?? '',
      date: DateTime.parse(json['date'] as String? ?? DateTime.now().toIso8601String()),
      playerA: MatchPlayer.fromJson(json['playerA'] as Map<String, dynamic>? ?? {}),
      playerB: MatchPlayer.fromJson(json['playerB'] as Map<String, dynamic>? ?? {}),
      status: json['status'] as String? ?? 'PENDING',
      score: json['score'] as String? ?? '0-0',
      winner: json['winner'] != null ? MatchPlayer.fromJson(json['winner']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'date': date.toIso8601String(),
    'playerA': playerA.toJson(),
    'playerB': playerB.toJson(),
    'status': status,
    'score': score,
    'winner': winner?.toJson(),
  };
}

class MatchPlayer {
  final String id;
  final String name;

  MatchPlayer({required this.id, required this.name});

  factory MatchPlayer.fromJson(Map<String, dynamic> json) {
    return MatchPlayer(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Unknown',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
  };
}

class Referee {
  final String id;
  final String firstName;
  final String lastName;
  final String nationality;
  final int matchesRefereed;
  final int ballCrewMatches;
  final int experience;
  final String? photo;
  final List<String> certifications;

  Referee({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.nationality,
    required this.matchesRefereed,
    required this.ballCrewMatches,
    required this.experience,
    this.photo,
    required this.certifications,
  });

  factory Referee.fromJson(Map<String, dynamic> json) {
    return Referee(
      id: json['id'] as String? ?? '',
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      nationality: json['nationality'] as String? ?? '',
      matchesRefereed: json['matchesRefereed'] as int? ?? 0,
      ballCrewMatches: json['ballCrewMatches'] as int? ?? 0,
      experience: json['experience'] as int? ?? 0,
      photo: json['photo'] as String?,
      certifications: (json['certifications'] as List?)?.cast<String>() ?? [],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'firstName': firstName,
    'lastName': lastName,
    'nationality': nationality,
    'matchesRefereed': matchesRefereed,
    'ballCrewMatches': ballCrewMatches,
    'experience': experience,
    'photo': photo,
    'certifications': certifications,
  };

  String get fullName => '$firstName $lastName';
}

class Organization {
  final String id;
  final String name;
  final String description;
  final String city;
  final String country;
  final double rating;
  final int activityScore;

  Organization({
    required this.id,
    required this.name,
    required this.description,
    required this.city,
    required this.country,
    required this.rating,
    required this.activityScore,
  });

  factory Organization.fromJson(Map<String, dynamic> json) {
    return Organization(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Unknown',
      description: json['description'] as String? ?? '',
      city: json['city'] as String? ?? '',
      country: json['country'] as String? ?? '',
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      activityScore: json['activityScore'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
    'city': city,
    'country': country,
    'rating': rating,
    'activityScore': activityScore,
  };
}
