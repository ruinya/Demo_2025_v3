const form = document.getElementById('form')

const formatDateSql = (inputDate) => {
  const [day, month, year] = inputDate.split('-'); 
  return `${year}-${month}-${day}`; 
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const member = {
    name: event.target.name.value,
    date: formatDateSql(event.target.date.value) || "0001-01-01",
    occupation: event.target.occupation.value || 'Безработный',
    address: event.target.address.value || '-',
    salary: event.target.salary.value || 0,
  }

  await window.api.addMember(member)
  form.reset()
})