// Helper parse JSON an toàn (backend có thể trả null/kiểu lệch nhẹ).
int asInt(dynamic v, [int d = 0]) => v is num ? v.toInt() : int.tryParse('$v') ?? d;
double asDouble(dynamic v, [double d = 0]) => v is num ? v.toDouble() : double.tryParse('$v') ?? d;
String asString(dynamic v, [String d = '']) => v == null ? d : v.toString();
String? asStrOrNull(dynamic v) => v?.toString();
bool asBool(dynamic v, [bool d = false]) => v is bool ? v : (v == 'true' ? true : (v == 'false' ? false : d));
List<Map<String, dynamic>> asMapList(dynamic v) =>
    (v is List) ? v.whereType<Map>().map((e) => e.cast<String, dynamic>()).toList() : const [];

// Danh sách phân trang cursor: { items, nextCursor } — §12.
class Paginated<T> {
  final List<T> items;
  final String? nextCursor;
  const Paginated(this.items, this.nextCursor);

  factory Paginated.from(dynamic json, T Function(Map<String, dynamic>) parse) {
    final map = (json is Map) ? json.cast<String, dynamic>() : <String, dynamic>{};
    return Paginated(asMapList(map['items']).map(parse).toList(), asStrOrNull(map['nextCursor']));
  }
}
