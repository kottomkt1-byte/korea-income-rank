# 소득의 위치 · INCOME ATLAS

**내 소득은 대한민국 상위 몇 %일까?**

국세청 공식 자료의 정의와 한계를 보존하는 근로소득·사업소득 비교 웹사이트입니다. Next.js App Router, TypeScript, Tailwind CSS, shadcn 스타일 Button/Radix Tabs, Lucide, Motion, Recharts, Zod를 사용합니다.

> **현재 상태: 웹사이트·계산 엔진 구현, 공식 숫자 데이터 등록 전.** 공식 메타데이터는 확인했지만 이 개발 환경에서 원본 CSV와 사업소득 통계표를 확보하지 못했습니다. 실제 근로소득·사업소득 백분위는 현재 비활성화되어 있습니다. 화면·공유 카드·SEO에 임의의 통계 숫자를 표시하지 않습니다. 원본 등록을 마치기 전에는 완성된 소득 순위 서비스로 운영할 수 없습니다.

## 실행

Node.js 22 이상을 권장합니다.

```bash
git clone https://github.com/kottomkt1-byte/korea-income-rank.git
cd korea-income-rank
npm ci
cp .env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 유료 API·DB·로그인 없이 작동합니다. 통계 자료는 빌드 시 포함되므로 운영 중 국세청 API를 호출하지 않습니다.

## 구현 기능

- 직장인 / 개인사업자·프리랜서 / 복수소득 탭과 키보드 탐색
- 연봉·월급, 만원·원 단위, 쉼표·빈값·음수·큰 금액 검증
- 매출 − 필요경비 참고 소득, 사업소득 손실 입력
- 검증된 자료에만 작동하는 백분위 추정·누적 구간 계산 엔진
- 근로·사업 개별 결과, 가정한 소득을 조절하는 시뮬레이터
- PNG 1080×1080 / 1080×1920 생성, Web Share, 링크 복사
- Kakao SDK 연결 옵션과 키 미설정 시 링크 복사 대체
- 금액 공개 체크박스: 기본 꺼짐. URL에는 개인 금액·순위 미포함
- `/methodology`, `/statistics`, `/privacy`, `/about`
- 서버 렌더링 FAQ, Metadata, OG, JSON-LD, robots, sitemap, canonical
- CSV/XLSX 검증·정규화·원본 해시 보존 CLI와 GitHub Actions CI
- 비활성 광고 예약 영역. 광고 서비스 스크립트는 설치하지 않음

## 실제 데이터 확보 상태

| 자료                                                                        | 확인한 내용                                                       | 현재 계산                                 |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------- |
| [근로소득 백분위(천분위)](https://www.data.go.kr/data/15082063/fileData.do) | 공식 설명·109행·컬럼·단위·2024년 귀속/2025년 신고·공개일·이용조건 | 원본 미확보, 순위 미제공                  |
| [TASIS 사업소득](https://tasis.nts.go.kr/)                                  | 검토 대상 표 3-2-5. 실제 행·주석·모집단 검증 미완료               | 순위 미제공, 참고 소득 산술 계산 가능     |
| 근로 + 사업                                                                 | 개인 단위 결합 분포 미확보                                        | 개별 자료 상태 표시, 합계는 참고값만 제공 |

확인일: 2026-10-17. 근로소득 포털 등록일은 2026-02-24, 수정일은 2026-05-08입니다. 파일명의 `20251231`은 귀속연도가 아닙니다. [확인 기록](data/metadata/source-check.json)에 출처와 접근 실패를 기록했습니다.

원본이 없으면 `status: unavailable`이 정상적인 안전 상태입니다. 현재 테스트가 통과한다는 것은 프로그램의 계약과 미확보 처리가 맞다는 뜻이지, 실제 통계 정확도를 검증했다는 뜻이 아닙니다.

## 데이터 등록

[정확한 원본 등록 절차](docs/DATA_IMPORT.md)를 따르세요. `data/processed/*.json`에 숫자를 직접 채우거나 `status`만 바꾸지 마세요.

```bash
npm run data:import -- --file /path/to/official.csv --manifest /path/to/reviewed.json --encoding euc-kr --dry-run
npm run data:import -- --file /path/to/official.csv --manifest /path/to/reviewed.json --encoding euc-kr
npm run check
```

사업소득은 소득금액 구간별 **중복 없는 사람 수**가 검증된 경우에만 등록합니다. 사업장 수·매출 구간·종합소득 구간으로 대체하지 않습니다. 등록 후 앱을 재빌드해야 합니다.

## 통계적 한계

근로소득은 구간 평균을 중간 순위 대표값으로 가정한 선형 보간입니다. 구간 평균은 실제 커트라인이 아니며 표시 소수점은 정확도를 보증하지 않습니다. 극상·극하위로 외삽하지 않습니다. 사업소득은 구간 내 분포를 가정하지 않고 가능한 누적 순위 범위를 표시합니다. 범위는 신뢰구간이 아닙니다.

근로소득 총급여와 사업소득금액은 정의가 다릅니다. 둘을 합친 금액은 종합소득금액과 같지 않을 수 있고, 개별 분포를 합쳐 통합 순위를 만들 수 없습니다. 각 자료의 귀속연도와 비교 모집단을 따로 보존합니다. [계산 설명](docs/STATISTICS.md)을 참고하세요.

## 검증

```bash
npm run check                    # 데이터 구조·린트·타입·단위 테스트·프로덕션 빌드
npx playwright install chromium
npm run test:e2e                 # 데스크톱·모바일 주요 흐름, PNG, 접근성, 개인정보
```

시스템 Chromium 사용 시 `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e`를 사용할 수 있습니다. 계산 테스트의 가상 분포는 `tests/fixtures/`에 **SYNTHETIC TEST FIXTURE**로 분리되어 있으며 서비스 모듈에서 가져오지 않습니다. 실제 자료와의 수치 대조는 원본 확보 후 별도 수행해야 합니다.

## Vercel 배포

1. Vercel에서 이 GitHub 저장소를 Import합니다. Framework: Next.js, Root Directory: 저장소 루트, Build: `npm run build`.
2. `NEXT_PUBLIC_SITE_URL`을 실제 HTTPS 도메인으로 설정하고 재배포합니다. 도메인 미설정·근로소득 원본 미검증 상태에서는 `noindex`를 유지합니다.
3. 공식 원본을 등록·검증한 커밋으로 배포하고, 실제 도메인에서 입력·PNG·공유·메타태그를 확인합니다.
4. 카카오 공유는 [추가 설정 가이드](docs/DEPLOYMENT.md)에 따라 JavaScript 키와 사이트 도메인을 설정합니다. 키가 없어도 다른 공유는 작동합니다.

이 저장소는 배포 호환 상태이며, Vercel 계정 연결이나 실제 사이트 배포는 아직 수행하지 않았습니다.

## 남은 작업

- 공식 근로소득 원본 다운로드, 인원·총급여 합계 대조 후 등록
- 사업소득 원본 표·주석·인원 중복/포함 범위 검증 후 등록
- 실제 자료로 추정값의 적합성 검토 및 UI 숫자 검수
- 운영 도메인·Vercel 연결, 필요 시 Kakao 앱 키 설정
- 광고 도입 시 실제 공급자 설정과 개인정보 안내 갱신

## 구조

```text
app/                      Next.js 페이지·SEO·공통 스타일
components/               입력·결과·차트·공유·공통 UI
lib/statistics/           Zod 스키마, 분포 검증, 계산, 운영 데이터 로더
data/processed/          운영 데이터 또는 명시적 미확보 상태
data/metadata/           공식 출처 확인 기록·등록 manifest 템플릿
data/raw/                등록 시 원본과 manifest 보존 (기본 Git 제외)
scripts/import/          CSV/XLSX 등록·검증·해시·원자적 교체
tests/fixtures/          운영과 분리한 SYNTHETIC TEST FIXTURE
e2e/                    Playwright 브라우저 테스트
docs/                   등록·계산·배포 설명
```

입력값의 서버 전송, 쿠키, 로컬 스토리지, 분석 이벤트는 구현하지 않았습니다. 호스팅 사업자의 일반 접속 로그는 별도 정책이 적용됩니다. Pretendard는 SIL Open Font License로 자체 제공되며 [라이선스](public/Pretendard-LICENSE.txt)를 포함합니다.
