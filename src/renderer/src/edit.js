const form = document.getElementById('form');

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const memberID = urlParams.get('id');
  const member = await window.api.getMemberById(memberID);
  console.log('Member: ', member);

  const formatDate = (inputDate) => {
    const date = new Date(inputDate);
    return date.toLocaleDateString('en-CA');  // Формат YYYY-MM-DD
};

  console.log('Date after format: ', document.getElementById('date').value = formatDate(member.date_of_birth));

  document.getElementById('name').value = member.name;
  document.getElementById('date').value = formatDate(member.date_of_birth);
  document.getElementById('occupation').value = member.occupation;
  document.getElementById('address').value = member.organization;
  document.getElementById('salary').value = member.salary;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const member = {
      name: event.target.name.value,
      date: event.target.date.value,
      occupation: event.target.occupation.value,
      address: event.target.address.value,
      salary: event.target.salary.value,
      id: memberID,
    };

    await window.api.editMember(member);
  });
});
