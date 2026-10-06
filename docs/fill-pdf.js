export function visibleQuestions(questions, answers) {
  const isVisible = (question) => {
    if (!question.showIf) return true;
    const dependency = questions.find((item) => item.id === question.showIf.id);
    if (dependency && !isVisible(dependency)) return false;
    return String(answers[question.showIf.id] ?? '') === String(question.showIf.value);
  };
  return questions.filter(isVisible);
}

function shouldApplyTextValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function questionPlacements(question, value) {
  if (question.positiveOnly) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return [];
  }
  if (!shouldApplyTextValue(value) && question.type !== 'multi') return [];

  if (question.type === 'choice' || question.type === 'scale') {
    const selected = question.options?.find((option) => String(option.value) === String(value));
    return selected?.placements ?? [];
  }

  if (question.type === 'multi') {
    const values = Array.isArray(value) ? value.map(String) : [];
    return question.options
      ?.filter((option) => values.includes(String(option.value)))
      .flatMap((option) => option.placements ?? []) ?? [];
  }

  return question.placements ?? [];
}

export function createFiller(rgb) {
  const markColor = rgb(0.04, 0.19, 0.60);

  function yFromTop(page, top, size = 0) {
    return page.getHeight() - top - size;
  }

  function fitText(font, text, size, maxWidth) {
    if (!maxWidth) return text;
    const normalized = String(text);
    if (font.widthOfTextAtSize(normalized, size) <= maxWidth) return normalized;

    let result = normalized;
    while (result.length > 0 && font.widthOfTextAtSize(`${result}...`, size) > maxWidth) {
      result = result.slice(0, -1);
    }
    return result ? `${result}...` : '';
  }

  function drawTextPlacement(page, font, placement, value) {
    const fontSize = placement.fontSize ?? 10;
    const text = fitText(font, value, fontSize, placement.width);
    page.drawText(text, {
      x: placement.x,
      y: yFromTop(page, placement.top, fontSize),
      size: fontSize,
      font,
      color: markColor,
      maxWidth: placement.width,
    });
  }

  function applyPlacement(page, font, placement, value) {
    switch (placement.type) {
      case 'check': {
        const size = placement.size ?? 15;
        const boxTop = placement.top;
        const x0 = placement.x + size * 0.18;
        const y0 = yFromTop(page, boxTop, size) + size * 0.52;
        const x1 = placement.x + size * 0.4;
        const y1 = yFromTop(page, boxTop, size) + size * 0.24;
        const x2 = placement.x + size * 0.82;
        const y2 = yFromTop(page, boxTop, size) + size * 0.78;
        page.drawLine({
          start: { x: x0, y: y0 },
          end: { x: x1, y: y1 },
          thickness: 1.6,
          color: markColor,
        });
        page.drawLine({
          start: { x: x1, y: y1 },
          end: { x: x2, y: y2 },
          thickness: 1.6,
          color: markColor,
        });
        break;
      }
      case 'circle': {
        const radiusX = placement.radiusX ?? 9;
        const radiusY = placement.radiusY ?? 7;
        page.drawEllipse({
          x: placement.x - radiusX * 0.45,
          y: page.getHeight() - placement.top - 5,
          xScale: radiusX * 0.45,
          yScale: radiusY * 0.45,
          color: markColor,
          borderWidth: 0,
        });
        break;
      }
      case 'ring': {
        page.drawEllipse({
          x: placement.x,
          y: page.getHeight() - placement.top,
          xScale: placement.radiusX ?? 5,
          yScale: placement.radiusY ?? 5,
          borderWidth: 1.4,
          borderColor: markColor,
        });
        break;
      }
      case 'underline': {
        const y = page.getHeight() - placement.top - 1;
        page.drawLine({
          start: { x: placement.x, y },
          end: { x: placement.x + (placement.width ?? 100), y },
          thickness: 1.4,
          color: markColor,
        });
        break;
      }
      case 'text':
        drawTextPlacement(page, font, placement, value);
        break;
      case 'eq5d_vas': {
        const raw = Number(value);
        if (!Number.isFinite(raw)) break;
        const score = Math.max(0, Math.min(100, raw));
        const top = placement.top100 + ((100 - score) / 100) * (placement.top0 - placement.top100);
        const y = page.getHeight() - top;
        page.drawLine({
          start: { x: placement.x - 15, y },
          end: { x: placement.x + 18, y },
          thickness: 1.6,
          color: markColor,
        });
        page.drawEllipse({
          x: placement.x,
          y,
          xScale: 8,
          yScale: 5,
          borderWidth: 1.4,
          borderColor: markColor,
        });
        page.drawText(String(score), {
          x: placement.x - 11,
          y: y - 18,
          size: 9,
          font,
          color: markColor,
        });
        break;
      }
      default: {
        const unknown = placement.type;
        throw new Error(`Unknown placement type: ${unknown}`);
      }
    }
  }

  function placementsForForm(form, questions, answers) {
    return questions.flatMap((question) => {
      const value = answers[question.id];
      return questionPlacements(question, value)
        .filter((placement) => !placement.formId || placement.formId === form.id)
        .map((placement) => ({
          question,
          placement,
          value,
        }));
    });
  }

  return { applyPlacement, placementsForForm };
}
