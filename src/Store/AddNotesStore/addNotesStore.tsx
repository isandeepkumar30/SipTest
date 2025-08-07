import { makeObservable, observable, action } from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, ToastAndroid } from 'react-native';

class AddNotesStore
{
  addNotesData: Array<{
    studentNotes: string;
    selectedFlags: string;
    selectedSetTypeFlag: string;
    selectedUnSetTypeFlag: string;
    selectedAdminOnly: string;
    flagSetDate: Date | null;
    flagUnsetDate: Date | null;

    showFlagSetDatePicker: boolean;
    showFlagUnsetDatePicker: boolean;

  }> = [
      {
        studentNotes: '',
        selectedFlags: '1',
        selectedSetTypeFlag: '1',
        selectedUnSetTypeFlag: '1',
        selectedAdminOnly: '2',
        flagSetDate: null,
        flagUnsetDate: null,
        showFlagSetDatePicker: false,
        showFlagUnsetDatePicker: false,
      },
    ];

  errorMessage: string = '';
  isLoading: boolean = false;
  expandedIndex: number | null = null;

  constructor()
  {
    makeObservable( this, {
      addNotesData: observable,
      errorMessage: observable,
      isLoading: observable,
      expandedIndex: observable,
      setStudentNotes: action.bound,
      setFlagSetDate: action.bound,
      setFlagUnsetDate: action.bound,
      setSelectedFlags: action.bound,
      setIsLoading: action.bound,
      setSelectedSetTypeFlag: action.bound,
      setSelectedUnSetTypeFlag: action.bound,
      setSelectedAdminOnly: action.bound,
      setShowFlagSetDatePicker: action.bound,
      setShowFlagUnsetDatePicker: action.bound,
      addNoteSection: action.bound,
      removeNoteSection: action.bound,
      toggleAccordion: action.bound,
      deleteNote: action.bound,
      setAddNotesData: action.bound,

    } );
  }

  addNoteSection ()
  {
    this.addNotesData.push( {
      studentNotes: '',
      selectedFlags: '1',
      selectedSetTypeFlag: '1',
      selectedUnSetTypeFlag: '1',
      selectedAdminOnly: '2',
      flagSetDate: null,
      flagUnsetDate: null,
      showFlagSetDatePicker: false,
      showFlagUnsetDatePicker: false,
    } );
  }

  removeNoteSection ( index: number )
  {
    this.addNotesData.splice( index, 1 );
  }


  setIsLoading ( isLoading: boolean )
  {
    this.isLoading = isLoading;
  }

  setStudentNotes ( index: number, studentNotes: string )
  {
    this.addNotesData[index].studentNotes = studentNotes;
  }

  setFlagSetDate ( index: number, date: Date | null )
  {
    this.addNotesData[index].flagSetDate = date;
  }

  setFlagUnsetDate ( index: number, date: Date | null )
  {
    this.addNotesData[index].flagUnsetDate = date;
  }

  setSelectedFlags ( index: number, selectedFlags: string )
  {
    this.addNotesData[index].selectedFlags = selectedFlags;
  }

  setSelectedSetTypeFlag ( index: number, selectedSetTypeFlag: string )
  {
    this.addNotesData[index].selectedSetTypeFlag = selectedSetTypeFlag;
  }

  setSelectedUnSetTypeFlag ( index: number, selectedUnSetTypeFlag: string )
  {
    this.addNotesData[index].selectedUnSetTypeFlag = selectedUnSetTypeFlag;
  }

  setSelectedAdminOnly ( index: number, selectedAdminOnly: string )
  {
    this.addNotesData[index].selectedAdminOnly = selectedAdminOnly;
  }

  setShowFlagSetDatePicker ( index: number, showFlagSetDatePicker: boolean )
  {
    this.addNotesData[index].showFlagSetDatePicker = showFlagSetDatePicker;
  }

  setShowFlagUnsetDatePicker ( index: number, showFlagUnsetDatePicker: boolean )
  {
    this.addNotesData[index].showFlagUnsetDatePicker = showFlagUnsetDatePicker;
  }

  toggleAccordion ( index: number )
  {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  deleteNote ( noteId: number )
  {
    this.addNotesData = this.addNotesData.filter( item => item.note_id !== noteId );
  }

  setAddNotesData ( notes: any[] )
  {
    this.addNotesData = notes;
  }


}

export const addNotesStore = new AddNotesStore();

