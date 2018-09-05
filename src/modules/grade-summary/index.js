import registerModule from '~/module';
import { waitForLoad, constructButton, createElement, insertCss } from '~/utils/dom';
import Dialog from '~/utils/dialog';
import { coursesListLoaded, observeCoursesBar } from '~/shared/progress';

import style from './style.css';

const selectors = {
  button: style.locals.button,
};

function letterGradeFromNumber(num) {
  const number = Number(num.split('%')[0]);
  const map = {
    90: 'A',
    80: 'B',
    70: 'C',
    60: 'D',
  };
  let letter = 'F';
  for (const grade in map) {
    if (number > grade) {
      letter = map[grade];
      const ones = number - grade;
      if (ones >= 7) {
        letter += '+';
      } else if (ones < 3 && ones >= 0) {
        letter += '-';
      }
    }
  }
  return letter;
}

function generateReport() {

  const gradeElemToObject = e => ({
    grade: e.textContent.trim(),
    class: e.parentNode.parentNode.children[0].children[0].children[0].textContent,
  });
  const formatGradeObject = e => {
    const className = e.class.split('-')[0].trim();
    const fullGrade = `${e.grade} (${letterGradeFromNumber(e.grade)})`;
    return `${className}: ${fullGrade}`;
  };
  const removeEmptyGrade = e => e.grade !== '--';

  const grades = Array.from(document.querySelectorAll('.showGrade'))
    .map(gradeElemToObject)
    .filter(removeEmptyGrade)
    .map(formatGradeObject);

  // span is necessary for multiple courses
  const dialogElem = (
    <div>
    {
      grades.length ?
      grades.map(grade => [grade, <br />]) :
      'No Graded Courses Yet'
    }
    </div>
  );

  const dialog = new Dialog('Grade Summary', dialogElem, {
    leftButtons: [Dialog.buttons.OK],
  });
  dialog.open();
}

const getCoursesBar = () => (
  document.querySelector(`#courses > :first-child > :first-child > :nth-child(2)
    > :first-child > :first-child > :first-child`)
);

async function addGradeButton() {
  await waitForLoad(coursesListLoaded);

  const button = constructButton(
    'Grade Summary',
    'gocp_grade-summary_button',
    '',
    generateReport,
  );
  button.classList.add(selectors.button);
  button.classList.add('pull-right');
  getCoursesBar().appendChild(button);
  return button;
}

async function gradeSummary(opts, unloaderContext) {
  const styles = insertCss(style.toString());
  unloaderContext.addRemovable(styles);

  let gradeButtonUnloader = unloaderContext.addRemovable(await addGradeButton());
  const coursesBarObserver = observeCoursesBar(async () => {
    gradeButtonUnloader.remove();
    gradeButtonUnloader = unloaderContext.addRemovable(await addGradeButton());
  });
  unloaderContext.addRemovable(coursesBarObserver);
}

export default registerModule('{d320791b-772e-47c4-a058-15156faea88e}', {
  name: 'Grade Summary',
  description: 'Button to show list of cumulative grades across all courses',
  main: gradeSummary,
});