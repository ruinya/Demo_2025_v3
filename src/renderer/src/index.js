const container = document.getElementById('info');
const budgetCounter = document.getElementById('budget');

window.addEventListener('DOMContentLoaded', async () => {
  const members = await window.api.getMembers();
  const budgetCount = await window.api.countBudget();
  console.log(budgetCount);

  const findBudget = (name) => {
    const res = budgetCount.map((person) => {
      if (name === person.name) {
        if (person.budget <= 0) {
          return 'Дефицит бюджета';
        } else if (person.budget > 0) {
          return "Профицит бюджета"
        }
      }
      return null;
    })
    return res.join('')
  }

  const info = members.map((member) => {
    return `
    <div class="container" data-id="${member.id}">
      <p>${member.name}</p>
      <p>Возраст: ${member.age}</p>
      <p>${member.occupation}</p>
      <p>Место работы: ${member.organization}</p>
      <p>Месячный доход: ${member.salary}</p>
      <p id="budget"> ${findBudget(member.name)}</p>
    </div>`;
  });

  container.innerHTML = info.join('');

  const containers = document.querySelectorAll('.container')
  containers.forEach((container) => {
    container.addEventListener('click', () => {
      const memberID = container.getAttribute('data-id')
      window.location.href = `./edit.html?id=${memberID}`
    })
  })
});
