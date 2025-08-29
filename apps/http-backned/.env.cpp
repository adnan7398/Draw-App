#include <bits/stdc++.h>
using namespace std;

#define FAST_IO ios::sync_with_stdio(false); cin.tie(nullptr);

typedef long long ll;
typedef unsigned long long ull;
typedef pair<int, int> pii;
typedef pair<ll, ll> pll;
typedef vector<int> vi;
typedef vector<ll> vll;

#define pb push_back
#define mp make_pair
#define fi first
#define se second
#define all(x) (x).begin(), (x).end()
#define sz(x) ((int)(x).size())

#define FOR(i, a, b) for (int i = (a); i < (b); i++)
#define F0R(i, a) FOR(i, 0, a)
#define FORD(i, a, b) for (int i = (a) - 1; i >= (b); i--)

const int INF = 1e9+7;
const ll LINF = 1e18;
const double PI = acos(-1.0);
const int MOD = 1e9 + 7;

#ifdef LOCAL
#define debug(x) cerr << #x << " = " << (x) << '\n';
#else
#define debug(x)
#endif

template<typename T> T gcd(T a, T b) { return b == 0 ? a : gcd(b, a % b); }
template<typename T> T lcm(T a, T b) { return a / gcd(a, b) * b; }

ll mod_pow(ll base, ll exp, ll mod = MOD) {
    ll result = 1;
    base %= mod;
    while (exp > 0) {
        if (exp & 1) result = (result * base) % mod;
        base = (base * base) % mod;
        exp >>= 1;
    }
    return result;
}

int main() {
    FAST_IO;

    int t = 1;
    // cin >> t;
    while (t--) {
       
    }

    return 0;
}
