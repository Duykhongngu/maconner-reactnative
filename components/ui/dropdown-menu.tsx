"use client";

import * as DropdownMenuPrimitive from "@rn-primitives/dropdown-menu";
import * as React from "react";
import {
  Platform,
  type StyleProp,
  StyleSheet,
  Text,
  type TextProps,
  View,
  type ViewStyle,
  Animated,
  useWindowDimensions,
} from "react-native";
import { Check } from "~/lib/icons/Check";
import { ChevronDown } from "~/lib/icons/ChevronDown";
import { ChevronRight } from "~/lib/icons/ChevronRight";
import { ChevronUp } from "~/lib/icons/ChevronUp";
import { cn } from "~/lib/utils";
import { TextClassContext } from "~/components/ui/text";

// Create a context to manage animations for native platforms
const DropdownAnimationContext = React.createContext<{
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
}>({
  fadeAnim: new Animated.Value(0),
  slideAnim: new Animated.Value(0),
});

const DropdownMenu = ({
  children,
  ...props
}: DropdownMenuPrimitive.RootProps) => {
  // Create animation values for native platforms
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-10)).current;

  return (
    <DropdownAnimationContext.Provider value={{ fadeAnim, slideAnim }}>
      <DropdownMenuPrimitive.Root {...props}>
        {children}
      </DropdownMenuPrimitive.Root>
    </DropdownAnimationContext.Provider>
  );
};

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  DropdownMenuPrimitive.SubTriggerRef,
  DropdownMenuPrimitive.SubTriggerProps & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => {
  const { open } = DropdownMenuPrimitive.useSubContext();

  // Use platform-specific icons and handle iOS/Android differences
  let Icon;
  if (Platform.OS === "web") {
    Icon = ChevronRight;
  } else if (Platform.OS === "ios") {
    Icon = open ? ChevronUp : ChevronDown;
  } else {
    // Android or other platforms
    Icon = open ? ChevronUp : ChevronDown;
  }

  return (
    <TextClassContext.Provider
      value={cn(
        "select-none text-sm native:text-lg text-primary",
        open && "native:text-accent-foreground"
      )}
    >
      <DropdownMenuPrimitive.SubTrigger
        ref={ref}
        className={cn(
          "flex flex-row web:cursor-default web:select-none gap-2 items-center web:focus:bg-accent web:hover:bg-accent active:bg-accent rounded-sm px-2 py-1.5 native:py-2 web:outline-none",
          open && "bg-accent",
          inset && "pl-8",
          className
        )}
        {...props}
      >
        <>{children}</>
        <Icon size={18} className="ml-auto text-foreground" />
      </DropdownMenuPrimitive.SubTrigger>
    </TextClassContext.Provider>
  );
});
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  DropdownMenuPrimitive.SubContentRef,
  DropdownMenuPrimitive.SubContentProps
>(({ className, ...props }, ref) => {
  const { open } = DropdownMenuPrimitive.useSubContext();
  const { fadeAnim, slideAnim } = React.useContext(DropdownAnimationContext);

  // Handle animations for native platforms
  React.useEffect(() => {
    if (Platform.OS !== "web") {
      if (open) {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -10,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  }, [open, fadeAnim, slideAnim]);

  // For native platforms, wrap with Animated.View
  if (Platform.OS !== "web") {
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          // Ensure proper elevation on Android
          ...(Platform.OS === "android" && { elevation: 5 }),
        }}
      >
        <DropdownMenuPrimitive.SubContent
          ref={ref}
          className={cn(
            "min-w-[8rem] overflow-hidden rounded-md border border-border mt-1 bg-popover p-1 shadow-md",
            className
          )}
          {...props}
        />
      </Animated.View>
    );
  }

  return (
    <DropdownMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border border-border mt-1 bg-popover p-1 shadow-md shadow-foreground/5 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        open
          ? "web:animate-in web:fade-in-0 web:zoom-in-95"
          : "web:animate-out web:fade-out-0 web:zoom-out",
        className
      )}
      {...props}
    />
  );
});
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  DropdownMenuPrimitive.ContentRef,
  DropdownMenuPrimitive.ContentProps & {
    overlayStyle?: StyleProp<ViewStyle>;
    overlayClassName?: string;
    portalHost?: string;
  }
>(
  (
    { className, overlayClassName, overlayStyle, portalHost, ...props },
    ref
  ) => {
    const { open } = DropdownMenuPrimitive.useRootContext();
    const { fadeAnim, slideAnim } = React.useContext(DropdownAnimationContext);
    const dimensions = useWindowDimensions();

    // Handle animations for native platforms
    React.useEffect(() => {
      if (Platform.OS !== "web") {
        if (open) {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: -10,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }
    }, [open, fadeAnim, slideAnim]);

    // Improved overlay handling for mobile
    const overlayStyles = React.useMemo(() => {
      if (Platform.OS !== "web") {
        return StyleSheet.flatten([
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(0,0,0,0.1)" },
          overlayStyle,
        ]);
      }
      return overlayStyle;
    }, [overlayStyle]);

    return (
      <DropdownMenuPrimitive.Portal hostName={portalHost}>
        <DropdownMenuPrimitive.Overlay
          style={overlayStyles}
          className={cn(
            "native:bg-black/10 native:backdrop-blur-sm",
            overlayClassName
          )}
        >
          {Platform.OS !== "web" ? (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                // Ensure proper elevation on Android
                ...(Platform.OS === "android" && { elevation: 5 }),
                // Ensure the dropdown doesn't go off-screen
                maxHeight: dimensions.height * 0.7,
                maxWidth: dimensions.width * 0.9,
              }}
            >
              <DropdownMenuPrimitive.Content
                ref={ref}
                className={cn(
                  "min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-md",
                  className
                )}
                {...props}
              />
            </Animated.View>
          ) : (
            <DropdownMenuPrimitive.Content
              ref={ref}
              className={cn(
                "z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-md shadow-foreground/5 web:data-[side=bottom]:slide-in-from-top-2 web:data-[side=left]:slide-in-from-right-2 web:data-[side=right]:slide-in-from-left-2 web:data-[side=top]:slide-in-from-bottom-2",
                open
                  ? "web:animate-in web:fade-in-0 web:zoom-in-95"
                  : "web:animate-out web:fade-out-0 web:zoom-out-95",
                className
              )}
              {...props}
            />
          )}
        </DropdownMenuPrimitive.Overlay>
      </DropdownMenuPrimitive.Portal>
    );
  }
);
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  DropdownMenuPrimitive.ItemRef,
  DropdownMenuPrimitive.ItemProps & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => {
  // Add platform-specific active state styles
  const activeStyle =
    Platform.OS === "ios" ? "active:bg-gray-100" : "active:bg-accent";

  return (
    <TextClassContext.Provider value="select-none text-sm native:text-lg text-popover-foreground web:group-focus:text-accent-foreground">
      <DropdownMenuPrimitive.Item
        ref={ref}
        className={cn(
          "relative flex flex-row web:cursor-default gap-2 items-center rounded-sm px-2 py-1.5 native:py-2 web:outline-none web:focus:bg-accent",
          activeStyle,
          "web:hover:bg-accent group",
          inset && "pl-8",
          props.disabled && "opacity-50 web:pointer-events-none",
          className
        )}
        {...props}
      />
    </TextClassContext.Provider>
  );
});
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  DropdownMenuPrimitive.CheckboxItemRef,
  DropdownMenuPrimitive.CheckboxItemProps
>(({ className, children, checked, ...props }, ref) => {
  // Add platform-specific active state styles
  const activeStyle =
    Platform.OS === "ios" ? "active:bg-gray-100" : "active:bg-accent";

  return (
    <DropdownMenuPrimitive.CheckboxItem
      ref={ref}
      className={cn(
        "relative flex flex-row web:cursor-default items-center web:group rounded-sm py-1.5 native:py-2 pl-8 pr-2 web:outline-none web:focus:bg-accent",
        activeStyle,
        props.disabled && "web:pointer-events-none opacity-50",
        className
      )}
      checked={checked}
      {...props}
    >
      <View className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check size={14} strokeWidth={3} className="text-foreground" />
        </DropdownMenuPrimitive.ItemIndicator>
      </View>
      <>{children}</>
    </DropdownMenuPrimitive.CheckboxItem>
  );
});
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  DropdownMenuPrimitive.RadioItemRef,
  DropdownMenuPrimitive.RadioItemProps
>(({ className, children, ...props }, ref) => {
  // Add platform-specific active state styles
  const activeStyle =
    Platform.OS === "ios" ? "active:bg-gray-100" : "active:bg-accent";

  return (
    <DropdownMenuPrimitive.RadioItem
      ref={ref}
      className={cn(
        "relative flex flex-row web:cursor-default web:group items-center rounded-sm py-1.5 native:py-2 pl-8 pr-2 web:outline-none web:focus:bg-accent",
        activeStyle,
        props.disabled && "web:pointer-events-none opacity-50",
        className
      )}
      {...props}
    >
      <View className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <View className="bg-foreground h-2 w-2 rounded-full" />
        </DropdownMenuPrimitive.ItemIndicator>
      </View>
      <>{children}</>
    </DropdownMenuPrimitive.RadioItem>
  );
});
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  DropdownMenuPrimitive.LabelRef,
  DropdownMenuPrimitive.LabelProps & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm native:text-base font-semibold text-foreground web:cursor-default",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  DropdownMenuPrimitive.SeparatorRef,
  DropdownMenuPrimitive.SeparatorProps
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }: TextProps) => {
  return (
    <Text
      className={cn(
        "ml-auto text-xs native:text-sm tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};
