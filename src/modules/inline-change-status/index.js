import classNames from 'classnames';

import createModule from '~/utils/module';
import { waitForLoad, insertCss, createElement } from '~/utils/dom';

import style from './style.css';

const TASKS_ASSIGNMENT_TYPE = 'My tasks';

const selectors = {
  inlined: style.locals.inlined,
  dropdown: 'gocp_inline-change-status_dropdown',
};

function simulateDropdownChange(elemIndex, index) {
  document.querySelectorAll('.assignment-status-update')[elemIndex].parentNode.children[0].click();
  setTimeout(() => {
    const elem = document.querySelectorAll('.assignment-status-update')[elemIndex].parentNode
      .querySelector(`
        *:nth-child(2) > :nth-child(3) > :first-child > :nth-child(2) > :first-child
      `);
    elem.selectedIndex = index;
    elem.dispatchEvent(new Event('change'));
  }, 0);

}

function createOptionElem(name, val) {
  return <option value={val}>{name}</option>;
}

function createDropdown(parentNode, controller, index, preVal) {
  const existingValue = preVal || document.querySelectorAll('.assignment-status-update')[index].parentNode.parentNode.children[5].textContent.trim();
  // oncampus natively uses non breaking spaces for ONLY in progress labels
  const optionNames = ['To Do', 'In\u00a0Progress', 'Completed'];
  optionNames.splice(optionNames.indexOf(existingValue), 1);

  const optionElems = [
    createOptionElem('-- Select --', '0'),
    createOptionElem(optionNames[0], '1'),
    createOptionElem(optionNames[1], '2'),
  ];
  const handleSelectChange = e => {
    const selectElem = e.target;
    if (selectElem.value === '0') {
      return;
    }
    selectElem.remove();
    createDropdown(parentNode, controller, index, optionNames[selectElem.value - 1]);
    simulateDropdownChange(index, selectElem.value);
  };

  const selectElem = (
    <select
      onChange={handleSelectChange}
      className={ classNames('form-control', selectors.dropdown) }
    >
      { optionElems }
    </select>
  );

  parentNode.appendChild(selectElem);
}

function replaceLinks() {
  const links = Array.from(document.getElementsByClassName('assignment-status-update'));
  links.forEach((button, i) => {
    const assignmentRow = button.parentNode.parentNode;
    const assignmentType = assignmentRow.querySelector('[data-heading="Type"]').textContent;
    if (assignmentType === TASKS_ASSIGNMENT_TYPE) {
      // [audit] confirm this does not target regular assignments
      return; // tasks also have an "edit" link, which needs to be available from the popover
    }
    assignmentRow.classList.add(selectors.inlined);
    createDropdown(button.parentNode, button, i);
  });
}

function addMutationObserver() {
  const table = document.querySelector('#assignment-center-assignment-items');
  const observer = new MutationObserver(replaceLinks);
  observer.observe(table, {
    childList: true,
  });
  return {
    remove() { observer.disconnect(); },
  };
}

const domQuery = () => document.querySelector('#assignment-center-assignment-items *');

async function inlineChangeStatus(opts, unloaderContext) {
  const styles = insertCss(style.toString());
  unloaderContext.addRemovable(styles);

  await waitForLoad(domQuery);
  replaceLinks();

  const observer = addMutationObserver();
  unloaderContext.addRemovable(observer);
}

function unloadInlineChangeStatus() {
  for (const inlineLink of document.querySelectorAll(`.${selectors.inline}`)) {
    inlineLink.classList.remove(selectors.inline);
  }
  for (const dropdown of document.querySelectorAll(`.${selectors.dropdown}`)) {
    dropdown.remove();
  }
}

export default createModule('{4155f319-a10b-4e4e-8a10-999a43ef9d19}', {
  name: 'Improved Status Dropdown',
  description: 'Show status dropdown directly in assignment, without having to click on "Change Status" link.',
  main: inlineChangeStatus,
  unload: unloadInlineChangeStatus,
});

