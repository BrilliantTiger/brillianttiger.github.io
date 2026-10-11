# Brilliant Tiger website

Source of **brillianttigercorp.com**, the company site of Brilliant Tiger (빛나는 범). Static, bilingual (English default, Korean at `/ko/`), zero npm dependencies.

빛나는 범(Brilliant Tiger) 회사 소개 사이트의 소스입니다. 영어가 기본(`/`), 한국어는 `/ko/`이고, 의존성 없는 순수 Node 빌드입니다.

## 빠르게 시작

```bash
npm run dev      # 빌드 + http://localhost:4173 미리보기 + 파일이 바뀌면 자동 재빌드
npm test         # 빌드 + 정적 검사 (링크, 앵커, alt, 중복 id, JSON-LD, 색 대비)
npm run stats    # 공개 저장소 수치(커밋·릴리스·Claude 공동 작성 비율)를 GitHub API에서 새로 가져옴
npm run build    # dist/ 만 만들기
```

Node 20 이상이면 됩니다. `node_modules`는 없습니다.

## 어디를 고치나

| 바꾸고 싶은 것 | 파일 |
| --- | --- |
| 문구 (영어 / 한국어) | `content/en.json`, `content/ko.json` — **두 파일의 키 구조가 같아야** 하고, 다르면 빌드가 실패합니다 |
| 회사·창업자 정보, 연락처 이메일, 제품 목록과 링크, 타임라인 | `content/site.json` |
| 공개 저장소 수치 | `content/stats.json` — 직접 고치지 말고 `npm run stats` |
| 디자인 | `public/assets/styles.css` (토큰은 맨 위, 라이트/다크는 `light-dark()` 한 벌) |
| 레이아웃·섹션 | `src/render.mjs`, 일러스트와 차트는 `src/art.mjs` |
| 로고, 파비콘, OG 이미지 | `public/assets/logo/`, `public/favicon.*`, `public/assets/og/` (아래 "브랜드 에셋") |

문구 안에서 쓸 수 있는 표기: `` `code` ``, `**굵게**`, `[[ko:한글]]`(한글 구간에 `lang="ko"` 부여), `[이름](https://…)`, 그리고 `{releases}` 같은 자리표시자(`src/render.mjs`의 `buildVars`에 정의). 문구는 전부 이스케이프되고, 남은 `{…}`는 `npm test`가 잡아냅니다.

## 운영 전에 확인할 것

- [ ] **연락처 이메일**: `content/site.json`의 `contact.email`. 비어 있으면 이메일 버튼과 JSON-LD의 email이 통째로 빠지고 GitHub 버튼만 남습니다. (`brillianttigercorp.com`의 MX는 Google Workspace라서 `이름@brillianttigercorp.com`을 쓸 수 있는 상태입니다.)
- [ ] `docs/fact-sheet.md`의 "확인 필요" 항목("AI와 나눈 대화에서 다듬은 기획" 문구)을 확인.
- [ ] 로고는 **임시 시안**입니다. 확정 로고가 생기면 아래 파일들을 교체하세요.
- [ ] 수치가 낡았으면 `npm run stats` 후 커밋 (배포 워크플로우도 빌드 전에 자동으로 한 번 돌립니다).

## 배포

### GitHub Pages (이 레포의 기본 설정)

이 레포는 public이고 Pages 소스는 **GitHub Actions**입니다. `main`에 push하면 `.github/workflows/pages.yml`이 stats 갱신 → `npm test` → 배포합니다. 기본 주소는 `https://brillianttiger.github.io/`입니다.

커스텀 도메인 `brillianttigercorp.com`을 쓰려면:
   - Settings → Pages → Custom domain에 입력 (또는 `gh api -X PUT repos/BrilliantTiger/brillianttiger.github.io/pages -f cname=brillianttigercorp.com`).
   - DNS(현재 DigitalOcean)에 apex `A` 185.199.108.153 / .109.153 / .110.153 / .111.153, `AAAA` 2606:50c0:8000::153 ~ 8003::153, 그리고 `www`는 `CNAME brillianttiger.github.io`. 기존 apex `A`/`AAAA`(DigitalOcean 서버)는 바꾸게 되니 그 주소에서 다른 서비스가 도는지 먼저 확인하세요.
   - **`MX`와 `TXT` 레코드(Google Workspace 메일)는 건드리지 않습니다.**
   - 인증서가 발급되면 "Enforce HTTPS" 체크.

### 다른 호스팅

Cloudflare Pages, Vercel, Netlify, DigitalOcean App Platform 모두 빌드 명령 `npm test`, 출력 디렉터리 `dist`로 됩니다. 이 경우 레포는 private으로 둘 수 있습니다.

## 브랜드 에셋

로고(저폴리 "브릴리언트 컷" 호랑이, 이마의 줄무늬는 호랑이의 상징인 王 모양)는 코드로 만든 **임시 시안**입니다. 색이나 모양을 바꾸려면 `scripts/brand/make_logo.py`의 좌표와 팔레트를 고치세요.

```bash
pip install pillow fonttools brotli
npm pack pretendard && tar -xzf pretendard-*.tgz package/dist/public/variable/PretendardVariable.ttf   # 폰트(OFL)
python3 scripts/brand/make_logo.py --font package/dist/public/variable/PretendardVariable.ttf --out public
python3 scripts/brand/make_og.py   --font package/dist/public/variable/PretendardVariable.ttf --out public/assets/og
```

- `logo-mark.svg`(맨 얼굴), `logo-icon.svg`(어두운 둥근 사각형 배지), `logo-horizontal*.svg`(글자를 도형으로 바꾼 가로형, 밝은/어두운 배경용), PNG는 `logo-mark-1024.png`, `logo-icon-192/512.png`, `apple-touch-icon.png`, `favicon.ico`.
- 사이트는 `logo-mark.svg`와 `logo-icon.svg`를 빌드할 때 HTML에 그대로 인라인합니다 (그래서 그라디언트·id 없이 단색 도형만 씁니다).
- 글꼴은 Pretendard Variable(SIL OFL 1.1)을 `public/assets/fonts/pretendard/`에 동적 서브셋으로 자체 호스팅합니다. 외부 CDN 요청이 없습니다.

## 구조

```
content/        site.json · en.json · ko.json · stats.json(생성물)
src/            build.mjs (빌드) · render.mjs (페이지) · art.mjs (SVG 일러스트·차트) · lib.mjs (헬퍼)
scripts/        update-stats.mjs · check.mjs · preview.mjs · dev.mjs · brand/ (로고·OG 생성)
public/         그대로 dist/로 복사되는 정적 파일 (CSS, JS, 폰트, 로고, 이미지)
docs/           fact-sheet.md (사이트의 모든 주장과 출처)
dist/           빌드 결과 (git 제외)
```

빌드가 만드는 것: `index.html`, `ko/index.html`, `404.html`, `sitemap.xml`(hreflang 포함), `robots.txt`, `llms.txt`, `site.webmanifest`, `CNAME`.

## 이 사이트가 하지 않는 것

쿠키, 추적기, 분석 도구, 외부 폰트·스크립트 요청이 없습니다. 테마 선택(라이트/다크)만 브라우저 `localStorage`에 저장합니다.

