import React, { useState } from 'react';
import { observer } from 'mobx-react';
import RadioGroup from 'react-native-radio-buttons-group';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import
{
  ActivityIndicator,
  Alert,
  ScrollView,
  useColorScheme,
  ToastAndroid,
  View,
  Text,
  TextInput,
  Pressable,
  TouchableHighlight,
} from 'react-native';
import { addNotesStore } from '../../../Store/AddNotesStore/addNotesStore';
import { AddNotesProps } from '../../../utils/DataTypeInterface/students_Data_Type';
import { AdminOnlyButton, FlagNotes, FlagSetType, FlagUnSetType } from '../../../utils/FlagRadioButton/flagRadioButton';
import { styles } from './addNotesstyle';
import { backgroundLabels, removeSectionLabels } from '../../../utils/statusLabel/statusLabel';

export const AddNotesSection: React.FC<AddNotesProps> = observer( ( { id } ) =>
{

  const colorScheme = useColorScheme();
  const dynamicStyles = styles( colorScheme );
  const [reloadKey, setReloadKey] = useState( 0 );
  const [minUnsetDate, setMinUnsetDate] = useState<Date>( new Date() );
  const [isLoading, setIsLoading] = useState<boolean>( true );
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback( () =>
    {
      addNotesStore.setAddNotesData( [
        {
          studentNotes: '',
          selectedFlags: '1',
          selectedSetTypeFlag: '1',
          selectedUnSetTypeFlag: '1',
          selectedAdminOnly: '2',
          selectedUrgent: '2',
          flagSetDate: null,
          flagUnsetDate: null,
          showFlagSetDatePicker: false,
          showFlagUnsetDatePicker: false,
        },
      ] );
      setIsLoading( false );
    }, [reloadKey] )
  );

  const formatDate = ( date: Date | null ) =>
  {
    if ( !date ) return 'DD/MM/YYYY';
    const day = date.getDate().toString().padStart( 2, '0' );
    const month = ( date.getMonth() + 1 ).toString().padStart( 2, '0' );
    const year = date.getFullYear();
    return `${ day }/${ month }/${ year }`;
  };

  const getTextColor = () =>
  {
    return colorScheme === 'dark' ? '#b6488d' : '#b6488d';
  };

  const getDateColor = () =>
  {
    return colorScheme === 'dark' ? '#000000' : '#000000';
  };

  const showFlagSetDatePickerHandler = ( index: number ) =>
  {
    if ( addNotesStore.addNotesData[index].selectedSetTypeFlag === '2' )
    {
      addNotesStore.setShowFlagSetDatePicker( index, true );
    } else if ( addNotesStore.addNotesData[index].selectedSetTypeFlag === '1' )
    {
      const currentDate = new Date();
      addNotesStore.setFlagSetDate( index, currentDate );
    }
  };

  const showFlagUnsetDatePickerHandler = ( index: number ) =>
  {
    addNotesStore.setShowFlagUnsetDatePicker( index, true );
    if ( addNotesStore.addNotesData[index].flagSetDate )
    {
      const minimumDate = new Date( addNotesStore.addNotesData[index].flagSetDate );
      minimumDate.setDate( minimumDate.getDate() + 1 );
      setMinUnsetDate( minimumDate );
    } else
    {
      setMinUnsetDate( new Date() );
    }
  };

  const onSetChange = ( event: Event, selectedDate?: Date, index?: number ) =>
  {
    if ( selectedDate && index !== undefined )
    {
      addNotesStore.setShowFlagSetDatePicker( index, false );
      addNotesStore.setFlagSetDate( index, selectedDate );
    }
  };

  const onUnsetChange = ( event: Event, selectedDate?: Date, index?: number ) =>
  {
    if ( selectedDate && index !== undefined )
    {
      addNotesStore.setShowFlagUnsetDatePicker( index, false );
      addNotesStore.setFlagUnsetDate( index, selectedDate );
    }
  };

  const handleRadioButtonChange = ( value: string, index: number ) =>
  {
  
    addNotesStore.setSelectedFlags( index, value );
  };

  const handleRadioButtonSetChange = ( value: string, index: number ) =>
  {
    addNotesStore.setSelectedSetTypeFlag( index, value );
  };

  const handleRadioButtonUnSetChange = ( value: string, index: number ) =>
  {
    addNotesStore.setSelectedUnSetTypeFlag( index, value );
  };

  const handleRadioButtonAdminOnly = ( value: string, index: number ) =>
  {
    addNotesStore.setSelectedAdminOnly( index, value );
  };

  const handleRadioButtonUrgent = ( value: string, index: number ) =>
  {
    addNotesStore.setSelectedUrgent( index, value );
  };

  const handleAddNoteSection = () =>
  {
    addNotesStore.addNoteSection();
  };

  const handleRemoveNoteSection = ( index: number ) =>
  {
    Alert.alert(
      'Confirmation',
      'Are you sure you want to remove this section?',
      [
        {
          text: 'Yes',
          onPress: () =>
          {
            addNotesStore.removeNoteSection( index );
          },
        },
        {
          text: 'No',
          onPress: () => { },
          style: 'cancel',
        },
      ],
      { cancelable: false }
    );
  };

  const onPressCancelButton = () =>
  {
    Alert.alert(
      'Confirmation',
      'Are you sure you want to cancel?',
      [
        {
          text: 'Yes',
          onPress: () =>
          {
            navigation.navigate( 'studentList' );
          },
        },
        {
          text: 'No',
          onPress: () => { },
          style: 'cancel',
        },
      ],
      { cancelable: false }
    );
  };

  const handleSubmit = async () =>
  {
    try
    {
      setIsLoading( true );
      for ( const [index, noteSection] of addNotesStore.addNotesData.entries() )
      {
        if ( !noteSection.studentNotes )
        {
          ToastAndroid.showWithGravity(
            `The student notes field is required for section ${ index + 1 }.`,
            ToastAndroid.LONG,
            ToastAndroid.BOTTOM
          );
          setIsLoading( false );
          return;
        }

        let flagSetType = '';
        let flagSetDate = '';
        let flagUnsetType = '';
        let flagUnsetDate = '';
        let studentNotesFlag = '';
        let adminOnly = noteSection.selectedAdminOnly === '1' ? 'yes' : 'no';
        let is_urgent = noteSection.selectedUrgent === '1' ? 'yes' : 'no';



        switch ( noteSection.selectedFlags )
        {
          case '1':
            studentNotesFlag = 'no_flag';
            break;
          case '2':
            studentNotesFlag = 'new_registration';
            break;
          case '3':
            studentNotesFlag = 'gray';
            break;
          case '4':
            studentNotesFlag = 'blue';
            break;
          case '5':
            studentNotesFlag = 'yellow';
            break;
          case '6':
            studentNotesFlag = 'red';
            break;
          case '7':
            studentNotesFlag = 'green';
            break;
          case '8':
            studentNotesFlag = 'purple';
            break;
          case '9':
            studentNotesFlag = 'orange';
            break;
          case '10':
            studentNotesFlag = 'brown';
            break;
          case '11':
            studentNotesFlag = 'golden';
            break;
          case '12':
            studentNotesFlag = 'pink';
            break;
          case '13':
            studentNotesFlag = 'parent';
            break;
          default:
            break;
        }

        if ( noteSection.selectedSetTypeFlag === '1' )
        {
          flagSetType = 'immediately';
          flagSetDate = formatDate( new Date() );
        } else if ( noteSection.selectedSetTypeFlag === '2' )
        {
          flagSetType = 'future_date';
          flagSetDate = formatDate( noteSection.flagSetDate );
        }

        if ( noteSection.selectedUnSetTypeFlag === '1' )
        {
          flagUnsetType = 'no_unset_date';
          flagUnsetDate = formatDate( new Date() );
        } else if ( noteSection.selectedUnSetTypeFlag === '2' )
        {
          flagUnsetType = 'specify_unset_date';
          flagUnsetDate = formatDate( noteSection.flagUnsetDate );
        }

        const apiUrlFromStorage = await AsyncStorage.getItem( 'selectedItemInfo' );
        if ( apiUrlFromStorage )
        {
          const apiUrl = JSON.parse( apiUrlFromStorage ).apiUrl;

          const requestBody = {
            studentKey: id.toString(),
            studentNotes: noteSection.studentNotes,
            studentNotesFlag: studentNotesFlag,
            flagSetType: flagSetType,
            flagSetDate: flagSetDate,
            flagUnsetType: flagUnsetType,
            flagUnsetDate: flagUnsetDate,
            only_admin: adminOnly,
            is_urgent: is_urgent,
          };

          const token = await AsyncStorage.getItem( 'token' );
          const response = await fetch( apiUrl + 'add-student-notes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${ token }`,
            },
            body: JSON.stringify( requestBody ),
          } );

          if ( !response.ok )
          {
            throw new Error( `Failed to submit note section ${ index + 1 }` );
          }
        }
      }

      ToastAndroid.showWithGravity(
        'All notes successfully submitted',
        ToastAndroid.LONG,
        ToastAndroid.BOTTOM
      );

      addNotesStore.setAddNotesData( [] );
      setReloadKey( ( prevKey ) => prevKey + 1 );
    } catch ( error: any )
    {
      console.error( 'Error submitting notes:', error );
      Alert.alert( 'Error', error.message || 'Something went wrong.' );
    } finally
    {
      setIsLoading( false );
    }
  };

  const FlagSetDate = ( index: number ) =>
  {
    return (
      <>
        <View style={{ marginTop: 10 }}>
          <View
            style={[
              dynamicStyles.flagNotesContainer,
              { marginTop: 10, marginBottom: 0 },
            ]}>
            <Text style={dynamicStyles.flagNotesLabel}>Flag set Type</Text>
            <Text style={dynamicStyles.flagNotesDescription}>
              Please select the flag set type here
            </Text>
          </View>
          <RadioGroup
            radioButtons={FlagSetType}
            onPress={( value ) => handleRadioButtonSetChange( value, index )}
            selectedId={addNotesStore.addNotesData[index].selectedSetTypeFlag}
            containerStyle={dynamicStyles.radioButtonContainerFlag}
          />
          {addNotesStore.addNotesData[index].selectedSetTypeFlag !== '1' && (
            <>
              <View
                style={[dynamicStyles.flagNotesContainer, { marginBottom: 0 }]}>
                <Text style={dynamicStyles.flagNotesLabel}>Flag set Date</Text>
                <Text style={dynamicStyles.flagNotesDescription}>
                  Please select the flag set date here
                </Text>
              </View>
              <View
                style={{
                  borderStyle: 'solid',
                  padding: 5,
                }}>
                <TouchableHighlight
                  onPress={() => showFlagSetDatePickerHandler( index )}
                  style={dynamicStyles.dateContainer}>
                  <View style={dynamicStyles.datePickerContainer}>
                    <Text style={dynamicStyles.datePickerIcon}>📅</Text>
                    <Text
                      style={[
                        dynamicStyles.selectedDateText,
                        { color: getDateColor() },
                      ]}>
                      {addNotesStore.addNotesData[index].flagSetDate
                        ? formatDate(
                          addNotesStore.addNotesData[index].flagSetDate
                        )
                        : 'DD/MM/YYYY'}
                    </Text>
                  </View>
                </TouchableHighlight>
                {addNotesStore.addNotesData[index].showFlagSetDatePicker && (
                  <DateTimePicker
                    testID="flagSetDatePicker"
                    value={
                      addNotesStore.addNotesData[index].flagSetDate || new Date()
                    }
                    mode="date"
                    is24Hour={true}
                    display="default"
                    onChange={( event, date ) =>
                      onSetChange( event, date, index )
                    }
                    minimumDate={new Date()}
                  />
                )}
              </View>
            </>
          )}
        </View>
      </>
    );
  };

  const FlatUnsetType = ( index: number ) =>
  {
    return (
      <>
        <View style={[dynamicStyles.flagNotesContainer, { marginBottom: 0 }]}>
          <Text style={dynamicStyles.flagNotesLabel}>Flag Unset Type</Text>
          <Text style={dynamicStyles.flagNotesDescription}>
            Please select the flag unset type here
          </Text>
        </View>
        <View>
          <RadioGroup
            radioButtons={FlagUnSetType}
            onPress={( value ) => handleRadioButtonUnSetChange( value, index )}
            selectedId={addNotesStore.addNotesData[index].selectedUnSetTypeFlag}
            containerStyle={dynamicStyles.radioButtonContainerFlag}
          />
        </View>

        {addNotesStore.addNotesData[index].selectedUnSetTypeFlag !== '1' && (
          <>
            <View style={dynamicStyles.flagNotesContainer}>
              <Text style={dynamicStyles.flagNotesLabel}>Flag Unset Date</Text>
              <Text style={dynamicStyles.flagNotesDescription}>
                Please select the flag unset date here
              </Text>
            </View>
            <View style={{ borderStyle: 'solid', padding: 5 }}>
              <TouchableHighlight
                onPress={() => showFlagUnsetDatePickerHandler( index )}
                style={dynamicStyles.dateContainer}
              >
                <View style={dynamicStyles.datePickerContainer}>
                  <Text style={dynamicStyles.datePickerIcon}>📅</Text>
                  <Text
                    style={[
                      dynamicStyles.selectedDateText,
                      { color: getDateColor() },
                    ]}
                  >
                    {addNotesStore.addNotesData[index].flagUnsetDate
                      ? formatDate( addNotesStore.addNotesData[index].flagUnsetDate )
                      : 'DD/MM/YYYY'}
                  </Text>
                </View>
              </TouchableHighlight>
              {addNotesStore.addNotesData[index].showFlagUnsetDatePicker && (
                <DateTimePicker
                  testID="flagUnsetDatePicker"
                  value={
                    addNotesStore.addNotesData[index].flagUnsetDate || new Date()
                  }
                  mode="date"
                  is24Hour={true}
                  display="default"
                  onChange={( event, date ) =>
                    onUnsetChange( event, date, index )
                  }
                  minimumDate={minUnsetDate} // This can be set as per your business logic
                />
              )}
            </View>
          </>
        )}
      </>
    );
  };

  if ( isLoading )
  {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#B6488D" />
      </View>
    );
  }

  return (
    <ScrollView key={reloadKey}>
      <View style={dynamicStyles.container}>
        {isLoading && <ActivityIndicator size="large" color="#B6488D" />}
        {addNotesStore.addNotesData.map( ( _, index ) => (
          <View
            key={index}
            style={[
              dynamicStyles.parentRow,
              {
                backgroundColor: backgroundLabels[index]?.backgroundColor,

              }
            ]}
          >
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,

              }}
            >

              {addNotesStore.addNotesData.length > 1 && (

                <Pressable onPress={() => handleRemoveNoteSection( index )}>
                  <Icon
                    name="delete"
                    size={24}
                    color={removeSectionLabels[index]?.color}
                    style={{
                      backgroundColor: removeSectionLabels[index]?.backgroundColor,
                      paddingVertical: 8,
                      paddingHorizontal: 20,
                      borderTopRightRadius: 8,
                    }}
                  />
                </Pressable>

              )}
            </View>

            <View style={[dynamicStyles.textInputContainer, { marginTop: addNotesStore.addNotesData.length > 1 ? 40 : 20 }]}>
              <TextInput
                multiline
                placeholder="Please enter the notes here"
                style={dynamicStyles.textInput}
                value={addNotesStore.addNotesData[index].studentNotes}
                onChangeText={( text ) => addNotesStore.setStudentNotes( index, text )}
                placeholderTextColor={getTextColor()}
              />
            </View>

            <View>
              <View style={dynamicStyles.flagNotesContainer}>
                <Text style={dynamicStyles.flagNotesLabel}>Flag Notes</Text>
                <Text style={dynamicStyles.flagNotesDescription}>
                  Please select the note's flag here
                </Text>
              </View>
            </View>

            <RadioGroup
              radioButtons={FlagNotes}
              onPress={( value ) => handleRadioButtonChange( value, index )}
              selectedId={addNotesStore.addNotesData[index].selectedFlags}
              containerStyle={[dynamicStyles.radioButtonContainer]}
            />

            {addNotesStore.addNotesData[index].selectedFlags !== '1' && (
              <View>
                {FlagSetDate( index )}
                {FlatUnsetType( index )}
              </View>
            )}

            {addNotesStore.errorMessage ? (
              <Text style={dynamicStyles.errorMessage}>
                {addNotesStore.errorMessage}
              </Text>
            ) : null}

            <View style={dynamicStyles.AdminOnlyNotes}>
              <Text style={dynamicStyles.flagNotesLabel}>Admin Only</Text>
              <RadioGroup
                radioButtons={AdminOnlyButton}
                onPress={( value ) => handleRadioButtonAdminOnly( value, index )}
                selectedId={addNotesStore.addNotesData[index].selectedAdminOnly}
                containerStyle={dynamicStyles.radioButtonContainerFlag}
              />
            </View>

            <View style={dynamicStyles.AdminOnlyNotes}>
              <Text style={dynamicStyles.flagNotesLabel}>Is Urgent</Text>
              <RadioGroup
                radioButtons={AdminOnlyButton}
                onPress={( value ) => handleRadioButtonUrgent( value, index )}
                selectedId={addNotesStore.addNotesData[index].selectedUrgent}
                containerStyle={dynamicStyles.radioButtonContainerFlag}
              />
            </View>
          </View>

        ) )}

        <View style={dynamicStyles.buttonContainer}>
          <Pressable
            onPress={onPressCancelButton}
            style={( { pressed } ) => [
              dynamicStyles.button,
              {
                backgroundColor: '#0073DA',
                height: 58,
                borderTopLeftRadius: 40,
                borderTopRightRadius: 40,
                borderBottomRightRadius: 40,
                borderBottomLeftRadius: 40,
              },
            ]}>
            <Text style={dynamicStyles.buttonText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            style={( { pressed } ) => [
              dynamicStyles.button,
              {
                backgroundColor: pressed ? 'pink' : '#B6488D',
                marginLeft: 20,
                height: 58,
                borderTopLeftRadius: 40,
                borderTopRightRadius: 40,
                borderBottomRightRadius: 40,
                borderBottomLeftRadius: 40,
              },
            ]}>
            <Text style={dynamicStyles.buttonText}>Submit</Text>
          </Pressable>
        </View>
        <Pressable onPress={handleAddNoteSection} style={dynamicStyles.addSectionButton}>
          <Text style={dynamicStyles.buttonText}>Add More +</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
} );
