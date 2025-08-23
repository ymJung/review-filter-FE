# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "로그인" [level=2] [ref=e6]
      - paragraph [ref=e7]: 소셜 계정으로 간편하게 로그인하세요
    - generic [ref=e8]:
      - button "Google로 로그인" [ref=e9] [cursor=pointer]:
        - img [ref=e10] [cursor=pointer]
        - generic [ref=e15] [cursor=pointer]: Google로 로그인
      - button "카카오로 로그인" [ref=e16] [cursor=pointer]:
        - img [ref=e17] [cursor=pointer]
        - generic [ref=e19] [cursor=pointer]: 카카오로 로그인
      - button "네이버로 로그인" [ref=e20] [cursor=pointer]:
        - img [ref=e21] [cursor=pointer]
        - generic [ref=e23] [cursor=pointer]: 네이버로 로그인
    - paragraph [ref=e25]:
      - text: 로그인하면
      - link "이용약관" [ref=e26] [cursor=pointer]:
        - /url: /terms
      - text: 및
      - link "개인정보처리방침" [ref=e27] [cursor=pointer]:
        - /url: /privacy
      - text: 에 동의하는 것으로 간주됩니다.
```