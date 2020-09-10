import React from 'react';
import { Animated, RefreshControl, View } from 'react-native';
import * as Styles from './styles';
import { Colors } from '@assets/Colors';
import { BaseHeader, headerConstants } from './BaseHeader';

interface BaseScreenProps {
  title: string;
  refreshMethod?: () => void;
  refreshing?: boolean;
  headerRightButton?: React.ReactElement;
  static?: string; // 'collapsed' or 'expanded'
  overlayButton?: React.ReactElement;
}

interface BaseScreenState {
  scrollY: Animated.Value;
}

export class BaseScreen extends React.Component<BaseScreenProps, BaseScreenState> {
  constructor(props: BaseScreenProps) {
    super(props);
    this.state = {
      scrollY: new Animated.Value(0),
    };
  }

  render() {
    const { scrollY } = this.state;
    const headerHeight = scrollY.interpolate({
      inputRange: [0, headerConstants.headerExpandedHeight - headerConstants.headerCollapsedHeight],
      outputRange: [headerConstants.headerExpandedHeight, headerConstants.headerCollapsedHeight],
      extrapolate: 'clamp',
    });

    const headerFontSize = scrollY.interpolate({
      inputRange: [40, 40 + headerConstants.titleMaxFont - headerConstants.titleMinFont],
      outputRange: [headerConstants.titleMaxFont, headerConstants.titleMinFont],
      extrapolate: 'clamp',
    });

    const headerBackgroundColor = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [`${Colors.backgroundGray}`, 'white'],
      extrapolate: 'clamp',
    });

    const headerShadowOpacity = scrollY.interpolate({
      inputRange: [20, 100],
      outputRange: [0, 0.25],
      extrapolate: 'clamp',
    });

    const ChildView = this.props.static ? View : Animated.ScrollView;
    return (
      <Styles.Background>
        <BaseHeader
          title={this.props.title}
          backgroundColor={headerBackgroundColor}
          height={headerHeight}
          shadowOpacity={headerShadowOpacity}
          fontSize={headerFontSize}
          rightButton={this.props.headerRightButton}
          static={this.props.static}
        />
        <ChildView
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: this.state.scrollY } } }])}
          refreshControl={
            <RefreshControl
              refreshing={this.props.refreshing}
              onRefresh={this.props.refreshMethod}
              tintColor={Colors.brandOlive}
            />
          }
          alwaysBounceVertical={true}
        >
          {this.props.children}
        </ChildView>
      </Styles.Background>
    );
  }
}
