import '../../core/json.dart';

class AuthUser {
  final String id;
  final String? email;
  final String? phone;
  final String username;
  final String displayName;
  final String? fandom;
  final String? avatarUrl;
  final String role; // USER | ADMIN
  final String? emailVerifiedAt;
  final String? phoneVerifiedAt;

  const AuthUser({
    required this.id,
    this.email,
    this.phone,
    required this.username,
    required this.displayName,
    this.fandom,
    this.avatarUrl,
    required this.role,
    this.emailVerifiedAt,
    this.phoneVerifiedAt,
  });

  bool get isVerified => emailVerifiedAt != null || phoneVerifiedAt != null;

  factory AuthUser.fromJson(Map<String, dynamic> j) => AuthUser(
        id: asString(j['id']),
        email: asStrOrNull(j['email']),
        phone: asStrOrNull(j['phone']),
        username: asString(j['username']),
        displayName: asString(j['displayName'], asString(j['username'])),
        fandom: asStrOrNull(j['fandom']),
        avatarUrl: asStrOrNull(j['avatarUrl']),
        role: asString(j['role'], 'USER'),
        emailVerifiedAt: asStrOrNull(j['emailVerifiedAt']),
        phoneVerifiedAt: asStrOrNull(j['phoneVerifiedAt']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'phone': phone,
        'username': username,
        'displayName': displayName,
        'fandom': fandom,
        'avatarUrl': avatarUrl,
        'role': role,
        'emailVerifiedAt': emailVerifiedAt,
        'phoneVerifiedAt': phoneVerifiedAt,
      };
}

class AuthResult {
  final String accessToken;
  final String refreshToken;
  final AuthUser user;

  const AuthResult(this.accessToken, this.refreshToken, this.user);

  factory AuthResult.fromJson(Map<String, dynamic> j) => AuthResult(
        asString(j['accessToken']),
        asString(j['refreshToken']),
        AuthUser.fromJson((j['user'] as Map).cast<String, dynamic>()),
      );
}
