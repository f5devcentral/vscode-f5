

export interface mtoken {
    token: string;
    tokenType: string;
    expiresIn: number;
    refreshToken: string;
    refreshExpiresIn: number;
    refreshEndDate: string;
}

export const mtokenExample: mtoken = {
    token: "eyJhbGciOiJIUzM4NCIsImtpZCI6IjBlMzM5MWU4LWI1N2ItNDQzZC1hOGEwLTc0MWRjNDc2M2Y4OSIsInR5cCI6IkpXVCJ9.eyJFeHRlbnNpb25zIjp7IngtZjUtdXNlci1wYXNzLWNoYW5nZSI6WyJubyJdLCJ4LWY1LXVzZXItcm9sZSI6WyJhZG1pbmlzdHJhdG9yIl0sIngtZjUtdXNlci1zdGF0dXMiOlsiZW5hYmxlZCJdLCJ4LWY1LXVzZXItc3RyYXRlZ3kiOlsibG9jYWwiXX0sIkdyb3VwcyI6bnVsbCwiSUQiOiJiMTQ5MTk3YS00M2E2LTQzODYtYWFmNi1hMTg1MDQxYzhhYmMiLCJOYW1lIjoiYWRtaW4iLCJhdWQiOlsiIl0sImV4cCI6MTY2NTQxMzE1MywiaWF0IjoxNjY1NDA5NTUzLCJuYmYiOjE2NjU0MDk1NTMsInN1YiI6ImIxNDkxOTdhLTQzYTYtNDM4Ni1hYWY2LWExODUwNDFjOGFiYyJ9.AmrluCgT6Fa2299Bevohu0PSNBX8-kUvhn910XQsQxnAmAQJ1GBGF2fjg8CdZJm9",
    tokenType: "Bearer",
    expiresIn: 3600,
    refreshToken: "YTQ4NTE3NmMtNjIyZS00MDQxLWEyMzUtNWU5NjRkNGNmNzU4OrfLVyx2xpsOrK6fpmm2AMFwLxIwAZbvSbJtbv++ZxqZMqMbzAXTiNxECsHTq7zYVA",
    refreshExpiresIn: 1209600,
    refreshEndDate: "2023-01-08T13:46:53Z",
  };


