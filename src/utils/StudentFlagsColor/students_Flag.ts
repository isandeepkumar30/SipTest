export const StudentFlagsData: Record<string, string> = {
  no_flag: '#000',
  grey: '#CFCFCF',
  blue: '#057FE1',
  yellow: '#FFC107',
  red: '#E91919',
  green: '#009688',
  purple: '#9C27B0',
  orange: '#FF5722',
  brown: '#795548',
  golden: '#DB8301',
  pink: '#E91E63',
  new_registration: '#00FFFF',
  parent: '',
};

export const getFlagDisplayText = ( flagText: string ) =>
{
  switch ( flagText )
  {
    case 'no_flag':
      return 'No Flag';
    case 'grey':
      return 'Finance';
    case 'blue':
      return 'Harpreet Singh';
    case 'yellow':
      return 'Customer Service';
    case 'red':
      return 'Tutors';
    case 'green':
      return 'Flat Bush';
    case 'purple':
      return 'Charanpreet Kaur';
    case 'orange':
      return 'Ashmeet';
    case 'brown':
      return 'Make-Up';
    case 'golden':
      return 'Mt Roskil';
    case 'pink':
      return 'Operations';
    case 'new_registration':
      return 'New Entry';
    case 'parent':
      return 'Parent';
    default:
      return flagText;
  }
};

export const getFlagTextColor = ( flagText: string ) =>
{
  switch ( flagText )
  {
    case 'no_flag':
    case 'new_registration':
    case 'yellow':
    case 'golden':
      return '#000';
    default:
      return '#fff';
  }
};