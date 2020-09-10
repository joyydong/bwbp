import React from 'react';
import { View, Text } from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { GlobalContext } from '@components/ContextProvider';
import { BaseScreen } from '../BaseScreen/BaseScreen';
import { JobCard } from './components/Card/JobCard';
import { JobRecord } from '@utils/airtable/interface';
import { getJobs, updateJob } from '@utils/airtable/requests';
import { Status } from '../StatusScreen/StatusScreen';
import ContactsModal from '@components/ContactsModal/ContactsModal';
import { StatusController } from '@screens/StatusScreen/StatusController';

// BWBP
import { Overlay, CheckBox, Button } from 'react-native-elements';
import { cloneDeep } from 'lodash';

interface Availability {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
}

interface JobsScreenState {
  title: string;
  jobs: JobRecord[];
  refreshing: boolean;
  staticHeader: boolean;
  status: Status;
  availability: Availability;
  overlayVisible: boolean;
}

interface JobsScreenProps {
  navigation: BottomTabNavigationProp;
}

/**
 * We have a feature request! 
 *
 * Write a function that filters out jobs based on the trainees weekly availability.
 * Bonus: Try wrapping the filtering logic in an overlay component.
 *
 * Sources:
 * - Compontent Library: https://react-native-elements.github.io/react-native-elements/docs/button.html
 *
 */
export class JobsScreen extends React.Component<JobsScreenProps, JobsScreenState> {
  static contextType = GlobalContext;

  constructor(props: JobsScreenProps) {
    super(props);

    this.state = {
      title: 'Jobs',
      jobs: [],
      refreshing: true,
      staticHeader: false,
      status: Status.none,
      availability: {
        monday: false,
        tuesday: false,
        wednesday: true,
        thursday: true,
        friday: false,
      },
      overlayVisible: true
    };
  }

  componentDidMount(): void {
    this.props.navigation.addListener('focus', this.fetchRecords);
  }

  createJobCard = (record: JobRecord, index: number): React.ReactElement => {
    return (
      <JobCard
        key={index}
        user={this.context.user}
        submitted={this.context.user.rid in record.users}
        jobRecord={record}
        updatefn={(): void => {
          updateJob(record.rid, this.context.user);
        }}
      />
    );
  };

  fetchRecords = async (): Promise<void> => {
    this.setState({
      refreshing: true,
    });
    const jobs: JobRecord[] = getJobs();
    this.setState({
      refreshing: false,
      jobs,
      status: this.getStatus(jobs),
    });
  };

  /**
   * TODO: Write filterJobs function that updates the components' state with jobs that align with the users' weekly schedule.
   */
  filterJobs = (jobs: JobRecord[], availability: Availability): void => {
    // Step 0: Clone the jobs input
    const newJobs: JobRecord[] = cloneDeep(jobs);
    console.log(newJobs, availability);

    // Step 1: Remove jobs where the schedule doesn't align with the users' availability.
    // Put all the days a trainee has indicated available into a set
    let daysAvailable: Set<string> = new Set<string>();
    for (const [key, value] of Object.entries(availability)) {
      if (value) {
        daysAvailable.add(key.charAt(0).toUpperCase() + key.slice(1));
      }
    }
    let numDaysAvailable : number = daysAvailable.size;

    // Remove stores from newJobs that do not match the required days available
    let removed : number = 0;
    for (let i = 0; i < jobs.length; i++) {
      let numDaysRequired : number = jobs[i].schedule.length;
      // Scenarios to remove a job:
      // 1. Number of days required for the job is greater than the number of days trainee is available
      // 2. if numDaysReq <= numDaysAvail: check that trainee is available on all days required for this job
      if (numDaysRequired > numDaysAvailable) { 
        newJobs.splice(i - removed, 1);
        removed++;
      } else { // numDaysReq <= numDaysAvail
        for (let j = 0; j < jobs[i].schedule.length; j++) {
          let dayRequired : string = jobs[i].schedule[j];
          if (!daysAvailable.has(dayRequired)) {
            newJobs.splice(i - removed, 1);
            removed++;
            break;
          }
        }
      }
    }

    // Step 2: Save into state
    this.setState({ jobs: newJobs });
  };

  getStatus = (jobs: JobRecord[]): Status => {
    if (!this.context.user.graduated) {
      return Status.jobLocked;
    } else if (jobs.length == 0) {
      return Status.noContent;
    } else {
      return Status.none;
    }
  };

  setHeader = (): void => {
    this.setState({ staticHeader: true });
  };

  renderCards(): React.ReactElement {
    return <>{this.state.jobs.map((record, index) => this.createJobCard(record, index))}</>;
  }

  render() {
    const { monday, tuesday, wednesday, thursday, friday } = this.state.availability;
    return (
      <BaseScreen
        title={this.state.title}
        refreshMethod={this.fetchRecords}
        refreshing={this.state.refreshing}
        static={this.state.status != Status.none ? 'expanded' : ''}
        headerRightButton={
          <ContactsModal
            resetTesting={(): void => {
              this.props.navigation.navigate('Login');
            }}
          />
        }
        overlayButton={
          <Button
            title="Update Availability"
            containerStyle={{ width: '50%' }}
            onPress={(): void => {
              this.setState({overlayVisible: true});
            }}
          /> 
        }
      >
        <View>
          <Overlay isVisible={this.state.overlayVisible} >
          <View>
              <Text>To view available jobs, select the days you are free to work:</Text>
            <CheckBox
              title="Monday"
              checked={monday}
              onPress={() =>
                this.setState(prev => {
                  return { ...prev, availability: { ...prev.availability, monday: !monday } };
                })
              }
            />
            <CheckBox
              title="Tuesday"
              checked={tuesday}
              onPress={() =>
                this.setState(prev => {
                  return { ...prev, availability: { ...prev.availability, tuesday: !tuesday } };
                })
              }
            />
            <CheckBox
              title="Wednesday"
              checked={wednesday}
              onPress={(): void =>
                this.setState(prev => {
                  return { ...prev, availability: { ...prev.availability, wednesday: !wednesday } };
                })
              }
            />
            <CheckBox
              title="Thursday"
              checked={thursday}
              onPress={(): void =>
                this.setState(prev => {
                  return { ...prev, availability: { ...prev.availability, thursday: !thursday } };
                })
              }
            />
            <CheckBox
              title="Friday"
              checked={friday}
              onPress={(): void =>
                this.setState(prev => {
                  return { ...prev, availability: { ...prev.availability, friday: !friday } };
                })
              }
            />
          </View>
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <Button
              title="Filter Search"
              containerStyle={{ width: '50%' }}
              onPress={(): void => {
                this.filterJobs(getJobs(), this.state.availability);
                this.setState({overlayVisible: false});
              }}
            />
          </View>
          </Overlay>
        </View>
        <StatusController defaultChild={this.renderCards()} status={this.state.status} />
      </BaseScreen>
    );
  }
}
