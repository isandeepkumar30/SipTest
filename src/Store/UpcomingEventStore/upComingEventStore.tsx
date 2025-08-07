import { makeObservable, observable, action } from 'mobx';

class UpcomingEventStore
{
  pastEventData: any[] = [];
  upcomingEventDetails: any[] = [];
  expandedIndex: number | null = null;
  isLoading: boolean = false;
  selectedValue: string = '';

  constructor()
  {
    makeObservable( this, {
      pastEventData: observable,
      expandedIndex: observable,
      isLoading: observable,
      selectedValue: observable,
      upcomingEventDetails: observable,
      setExpandedIndex: action.bound,
      setPastEventdata: action.bound,
      setSelectedValue: action.bound,
      setIsLoading: action.bound,
      setUpcomingEventsDetails: action.bound,
    } );
  }

  setIsLoading ( isLoading: boolean )
  {
    this.isLoading = isLoading;
  }
  setPastEventdata ( pastEventData: any[] )
  {
    this.pastEventData = pastEventData;
  }
  setUpcomingEventsDetails ( upcomingEventDetails: any[] )
  {
    this.upcomingEventDetails = upcomingEventDetails;
  }
  setExpandedIndex ( index: number | null )
  {
    this.expandedIndex = index;
  }
  setSelectedValue ( value: string )
  {
    this.selectedValue = value;
  }
}

export const upcomingEventStore = new UpcomingEventStore();
