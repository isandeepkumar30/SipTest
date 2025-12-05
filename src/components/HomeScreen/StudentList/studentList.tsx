import React, { useCallback, useEffect } from 'react';
import { View, Text, Linking, Image, BackHandler } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { getFlagDisplayText, getFlagTextColor, StudentFlagsData } from '../../../utils/StudentFlagsColor/students_Flag';
import { StudentListComponentProps } from '../../../utils/DataTypeInterface/students_Data_Type';
import { observer } from 'mobx-react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { statusLabels } from '../../../utils/statusLabel/statusLabel';
import { Pressable } from 'react-native';
import { styles } from './studentListStyle';
import LinearGradient from 'react-native-linear-gradient';


export const StudentListComponent: React.FC<StudentListComponentProps> =
  observer( ( { studentdataList } ) =>
  {

    const navigation = useNavigation();

    const handleAddNotes = (
      firstname: string,
      lastname: string,
      id: string,
      joining_date: string,
    ) =>
    {
      navigation.navigate( 'NotesScreen', {
        firstname,
        lastname,
        id,
        joining_date,
      } );
    };

    const handleUpcomingNotes = (
      firstname: string,
      lastname: string,
      id: string,
      joining_date: string,
    ) =>
    {
      navigation.navigate( 'UpcomingNotesScreen', {
        firstname,
        lastname,
        id,
        joining_date,
      } );
    };


    return (
      <>
        {studentdataList.map( ( item: any ) => (
          <View key={item.id} style={styles.parentRow}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
              }}>
              <Text
                style={{
                  backgroundColor: statusLabels[item.status]?.backgroundColor,
                  color: statusLabels[item.status]?.color,
                  paddingTop: 8,
                  paddingBottom: 8,
                  paddingRight: 20,
                  paddingLeft: 20,
                  borderTopRightRadius: 8,
                }}>
                {statusLabels[item.status]?.label}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}>
              <View>
                <Text style={styles.studentName}>
                  {item.firstname} {item.lastname}
                </Text>
                <Text style={styles.franchisee}>
                  <Text>{item.joining_date}</Text>
                </Text>
                <Text style={styles.starpoints}>
                  <Text>Star Points:- {item.star_points} <Icon name="star" size={16} color="#FFD700" /></Text>
                </Text>

              </View>
            </View>

            <View>
              {item.parent_details.map( ( subItem: any, subIndex: number ) => (
                <View
                  key={subIndex}
                  style={[styles.parentDetails, { display: 'flex' }]}>
                  <Text
                    style={[styles.parentText, { width: '65%', paddingEnd: 10 }]}>
                    {subItem.firstname} {subItem.lastname}
                  </Text>
                  <Text>
                    <Pressable
                      onPress={() =>
                      {
                        const phoneNumber = subItem.phone;
                        const countryCode = subItem.phone_country;
                        if ( phoneNumber && countryCode )
                        {
                          const fullPhoneNumber = `${ countryCode }${ phoneNumber }`;
                          Linking.openURL( `tel:${ fullPhoneNumber }` )
                            .then( () => { } )
                            .catch( error => { } );
                        }
                      }}
                      disabled={false}
                      style={[
                        styles.button,
                        { marginBottom: 10, marginRight: 8 },
                      ]}>
                      <Icon
                        name="phone"
                        size={18}
                        style={[
                          styles.phoneIcon,
                          {
                            marginBottom: 10,

                            backgroundColor: '#0A9856',
                          },
                        ]}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() =>
                      {
                        const phoneNumber = subItem.phone;
                        const countryCode = subItem.phone_country;
                        if ( phoneNumber && countryCode )
                        {
                          const fullPhoneNumber = `${ countryCode }${ phoneNumber }`;
                          if ( fullPhoneNumber )
                          {
                            Linking.openURL( `https://wa.me/${ fullPhoneNumber }` )
                              .then( () => { } )
                              .catch( error =>
                              {
                                console.error(
                                  'Failed to open WhatsApp: ',
                                  error,
                                );
                              } );
                          } else
                          {
                            console.warn( 'Phone number is not available' );
                          }
                        }
                      }}
                      disabled={false}
                      style={[
                        styles.button,
                        { marginBottom: 10, marginLeft: 8 },
                      ]}>
                      <Icon
                        name="whatsapp"
                        size={18}
                        style={[
                          styles.whatsappIcon,
                          {
                            marginBottom: 10,
                            marginRight: 8,
                            backgroundColor: '#25d366',
                          },
                        ]}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() =>
                      {
                        const email = subItem.email;
                        if ( email )
                        {
                          Linking.openURL( `mailto:${ email }` )
                            .then( () => { } )
                            .catch( error =>
                            {
                              console.error(
                                'Failed to open email app: ',
                                error,
                              );
                            } );
                        } else
                        {
                          console.warn( 'Email address is not available' );
                        }
                      }}
                      disabled={false}
                      style={[
                        styles.button,
                        { marginBottom: 10, marginRight: 8 },
                      ]}>
                      <Icon
                        name="envelope-o"
                        size={18}
                        style={[
                          styles.messageIcon,
                          {
                            marginBottom: 10,
                            marginRight: 8,
                            backgroundColor: '#F7AA25',
                          },
                        ]}
                      />
                    </Pressable>
                  </Text>
                </View>
              ) )}
            </View>

            <View
              style={[
                styles.buttonContainer,
                {
                  borderBottomWidth: 1,
                  marginTop: 5,
                  borderStyle: 'dashed',
                  paddingBottom: 20,
                  borderColor: '#BFBFBF',
                },
              ]}>
              {item.feedback_flag === 1 ? (
                <Pressable disabled={true} style={[styles.button]}>
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        borderTopLeftRadius: 5,
                        borderTopRightRadius: 5,
                        borderBottomRightRadius: 5,
                        borderBottomLeftRadius: 5,
                        backgroundColor: '#8BC34A',
                      },
                    ]}>
                    Feedback Pending
                  </Text>
                </Pressable>
              ) : null}

              {item.courier_flag === 1 ? (
                <Pressable disabled={true} style={[styles.button]}>
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        borderTopLeftRadius: 5,
                        borderTopRightRadius: 5,
                        borderBottomRightRadius: 5,
                        borderBottomLeftRadius: 5,
                        backgroundColor: '#2196F3',
                      },
                    ]}>
                    Courier Pending
                  </Text>
                </Pressable>
              ) : null}

              {item.improvement_session_flag === 1 ? (
                <Pressable disabled={true} style={[styles.button]}>
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        borderTopLeftRadius: 5,
                        borderTopRightRadius: 5,
                        borderBottomRightRadius: 5,
                        borderBottomLeftRadius: 5,
                        backgroundColor: '#795548',
                      },
                    ]}>
                    Improvement Session Flag
                  </Text>
                </Pressable>
              ) : null}

              {item.meeting_flag === 1 ? (
                <Pressable disabled={true} style={[styles.button]}>
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        borderTopLeftRadius: 5,
                        borderTopRightRadius: 5,
                        borderBottomRightRadius: 5,
                        borderBottomLeftRadius: 5,
                        backgroundColor: '#9C27B0',
                      },
                    ]}>
                    Meeting Flag
                  </Text>
                </Pressable>
              ) : null}

              {item.payment_flag === 1 ? (
                <Pressable disabled={true} style={[styles.button]}>
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        borderTopLeftRadius: 5,
                        borderTopRightRadius: 5,
                        borderBottomRightRadius: 5,
                        borderBottomLeftRadius: 5,
                        backgroundColor: '#F44336',
                      },
                    ]}>
                    Payment Pending
                  </Text>
                </Pressable>
              ) : null}

              {item.makeup_flag === 1 ? (
                <Pressable disabled={true} style={[styles.button]}>
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        borderTopLeftRadius: 5,
                        borderTopRightRadius: 5,
                        borderBottomRightRadius: 5,
                        borderBottomLeftRadius: 5,
                        backgroundColor: '#F3CF51',
                      },
                    ]}>
                    Makeup Session Needed
                  </Text>
                </Pressable>
              ) : null}

              {item.attendance_flag === 1 ? (
                <Pressable disabled={true} style={[styles.button]}>
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        borderTopLeftRadius: 5,
                        borderTopRightRadius: 5,
                        borderBottomRightRadius: 5,
                        borderBottomLeftRadius: 5,
                        backgroundColor: '#607D8B',
                      },
                    ]}>
                    Absent without Notice
                  </Text>
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.franchisee}>
              <Text>Raised Flag Notes:-</Text>
            </Text>
            <View
              style={[
                styles.buttonContainer,
                { paddingTop: 20, paddingBottom: 30, borderColor: '#BFBFBF' },
              ]}>

              {item.notes_flags.map( ( flagText: any, index: any ) => (
                flagText === 'parent' ? (
                  <LinearGradient
                    key={index}
                    colors={['rgba(199,34,43,1)', 'rgba(105,125,18,1)', 'rgba(145,201,44,1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.studentFlags,
                      {
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 7,
                        borderStyle: 'solid',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        {
                          fontWeight: '600',
                          fontSize: 12,
                          paddingTop: 3,
                          paddingBottom: 3,
                          paddingLeft: 8,
                          paddingRight: 8,
                          color: getFlagTextColor( flagText ),
                          textAlign: 'center',
                          borderTopLeftRadius: 5,
                          borderTopRightRadius: 5,
                          borderBottomRightRadius: 5,
                          borderBottomLeftRadius: 5,
                        },
                      ]}
                    >
                      {getFlagDisplayText( flagText )}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View
                    key={index}
                    style={[
                      styles.studentFlags,
                      {
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: StudentFlagsData[flagText],
                        marginRight: 7,
                        borderStyle: 'solid',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        {
                          fontWeight: '600',
                          fontSize: 12,
                          paddingTop: 3,
                          paddingBottom: 3,
                          paddingLeft: 8,
                          paddingRight: 8,
                          color: getFlagTextColor( flagText ),
                          textAlign: 'center',
                          borderTopLeftRadius: 5,
                          borderTopRightRadius: 5,
                          borderBottomRightRadius: 5,
                          borderBottomLeftRadius: 5,
                        },
                      ]}
                    >
                      {getFlagDisplayText( flagText )}
                    </Text>
                  </View>
                )
              ) )}

            </View>

            <View style={styles.footerButtons}>
              <Pressable style={{ width: '48%' }}>
                <View>
                  <Pressable
                    style={[
                      styles.footerButton,
                      { width: '100%', justifyContent: 'center' },
                    ]}
                    onPress={() =>
                      handleAddNotes(
                        item.firstname,
                        item.lastname,
                        item.id,
                        item.joining_date,
                      )
                    }>
                    <Icon
                      name="copy"
                      size={18}
                      style={styles.footerButtonIcon}
                    />
                    <Text style={styles.footerButtonText}>Notes</Text>
                  </Pressable>
                </View>
              </Pressable>

              <Pressable style={{ width: '48%' }}>
                <View>
                  <Pressable
                    style={[
                      styles.footerButton,
                      {
                        backgroundColor: '#057FE1',
                        width: '100%',
                        justifyContent: 'center',
                      },
                    ]}
                    onPress={() =>
                      handleUpcomingNotes(
                        item.firstname,
                        item.lastname,
                        item.id,
                        item.joining_date,
                      )
                    }>
                    <Icon
                      name="calendar"
                      size={18}
                      style={styles.footerButtonIcon}
                    />
                    <Text style={styles.footerButtonText}> Events</Text>
                  </Pressable>
                </View>
              </Pressable>
            </View>
          </View>
        ) )}
      </>
    );
  } );
