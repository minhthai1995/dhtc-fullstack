# Handoff — fullstack-template

> **TL;DR cho phiên mới:** Đây là template — chưa có code business logic nào. Đọc `docs/specs/00-product-vision.md` để hiểu scope dự án thật khi bắt đầu.

---

## Trạng thái hiện tại

- **Phase**: Template (chưa có feature business logic)
- **Đã có**: Auth end-to-end (login → JWT → sessionStorage → protected routes)
- **Đang làm**: _(điền vào khi bắt đầu dự án thật)_
- **Blocked**: _(điền nếu có)_

## Files đang sửa / cần tiếp tục

_(điền vào khi có context cụ thể)_

## Quyết định gần đây

- ADR-0001: Tech stack đã chốt — xem `docs/adr/0001-tech-stack.md`

## Việc cần làm tiếp theo

1. Điền `docs/specs/00-product-vision.md` với product vision thật
2. Viết spec cho feature đầu tiên: `docs/specs/01-<feature>/`
3. Chạy `/feature <name>` để scaffold BE + FE

---

## Cách update handoff.md

Cuối mỗi phiên Claude Code, cập nhật:
1. **TL;DR** — 1-2 câu trạng thái hiện tại
2. **Trạng thái** — phase, đang làm gì, blocked không
3. **Files đang sửa** — file nào đang dở dang
4. **Quyết định gần đây** — link ADR nếu có

**KHÔNG dùng handoff.md như git log.** Chi tiết commit → xem `git log`. Handoff chỉ lưu state hiện tại + context khó khôi phục từ commit.
