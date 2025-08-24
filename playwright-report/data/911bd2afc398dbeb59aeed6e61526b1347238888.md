# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e6]:
    - img [ref=e8]
    - generic [ref=e10]:
      - heading "로그인이 필요합니다" [level=3] [ref=e11]
      - generic [ref=e12]:
        - paragraph [ref=e13]: 이 페이지에 접근하려면 로그인해주세요.
        - link "로그인하기" [ref=e14] [cursor=pointer]:
          - /url: /login
          - button "로그인하기" [ref=e15] [cursor=pointer]
```