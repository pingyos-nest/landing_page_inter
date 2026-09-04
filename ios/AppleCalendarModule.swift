import Foundation
import EventKit
import EventKitUI
import React

@objc(AppleCalendarModule)
class AppleCalendarModule: NSObject, EKEventEditViewDelegate {
    
    private let eventStore = EKEventStore()
    private var currentResolve: RCTPromiseResolveBlock?
    private var currentReject: RCTPromiseRejectBlock?
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    /**
     * Presents Apple's native EKEventEditViewController pre-populated with conference event data.
     * Requests write access (least privilege), prepares dates in the user's local timezone,
     * and shows the native Apple event sheet.
     */
    @objc(presentEventEditor:resolver:rejecter:)
    func presentEventEditor(_ eventData: NSDictionary,
                            resolver: @escaping RCTPromiseResolveBlock,
                            rejecter: @escaping RCTPromiseRejectBlock) {
        
        self.currentResolve = resolver
        self.currentReject = rejecter
        
        // Request calendar write authorization
        requestCalendarAuthorization { [weak self] granted, error in
            guard let self = self else { return }
            
            if !granted {
                let errorMessage = error?.localizedDescription ?? "Calendar access was denied or restricted."
                self.rejectWithError(code: "PERMISSION_DENIED", message: errorMessage)
                return
            }
            
            DispatchQueue.main.async {
                self.showEventEditor(with: eventData)
            }
        }
    }
    
    /**
     * Requests least-privilege calendar write permission, supporting iOS 17+ write-only access.
     */
    private func requestCalendarAuthorization(completion: @escaping (Bool, Error?) -> Void) {
        if #available(iOS 17.0, *) {
            eventStore.requestWriteOnlyAccessToEvents { granted, error in
                completion(granted, error)
            }
        } else {
            eventStore.requestAccess(to: .event) { granted, error in
                completion(granted, error)
            }
        }
    }
    
    /**
     * Pre-populates the EKEvent and presents EKEventEditViewController.
     */
    private func showEventEditor(with eventData: NSDictionary) {
        guard let rootViewController = RCTPresentedViewController() else {
            rejectWithError(code: "VIEW_CONTROLLER_ERROR", message: "Unable to find top view controller to present Apple Calendar.")
            return
        }
        
        let title = eventData["title"] as? String ?? "2027 International Nursing Conference"
        let location = eventData["location"] as? String ?? "Chiang Mai, Thailand"
        let notes = eventData["notes"] as? String ?? ""
        let isAllDay = eventData["allDay"] as? Bool ?? true
        let startDateStr = eventData["startDate"] as? String ?? "2027-11-11"
        let endDateStr = eventData["endDate"] as? String ?? "2027-11-13"
        
        // Create EKEvent instance
        let event = EKEvent(eventStore: eventStore)
        event.title = title
        event.location = location
        event.notes = notes
        event.isAllDay = isAllDay
        
        // Parse date strings YYYY-MM-DD into calendar dates without timezone shifting
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.timeZone = TimeZone.current
        
        let calendar = Calendar.current
        
        if let parsedStart = dateFormatter.date(from: startDateStr),
           let parsedEnd = dateFormatter.date(from: endDateStr) {
            
            // For all-day events in Apple EventKit:
            // start date should be at 00:00:00 on start day (2027-11-11)
            // end date should be at 00:00:00 on the exclusive boundary day (2027-11-13)
            // or 23:59:59 on the last day. EventKit's EKEventEditViewController accurately
            // shows 11–12 Nov 2027 when start is 2027-11-11 and end is 2027-11-13.
            var startComponents = calendar.dateComponents([.year, .month, .day], from: parsedStart)
            startComponents.hour = 0
            startComponents.minute = 0
            startComponents.second = 0
            
            var endComponents = calendar.dateComponents([.year, .month, .day], from: parsedEnd)
            endComponents.hour = 0
            endComponents.minute = 0
            endComponents.second = 0
            
            event.startDate = calendar.date(from: startComponents) ?? parsedStart
            event.endDate = calendar.date(from: endComponents) ?? parsedEnd
        } else {
            rejectWithError(code: "INVALID_DATES", message: "Failed to parse event dates.")
            return
        }
        
        // Use default calendar
        event.calendar = eventStore.defaultCalendarForNewEvents
        
        // Create and configure EKEventEditViewController
        let editController = EKEventEditViewController()
        editController.eventStore = eventStore
        editController.event = event
        editController.editViewDelegate = self
        editController.modalPresentationStyle = .formSheet
        
        rootViewController.present(editController, animated: true, completion: nil)
    }
    
    // MARK: - EKEventEditViewDelegate
    
    func eventEditViewController(_ controller: EKEventEditViewController, didCompleteWith action: EKEventEditViewAction) {
        controller.dismiss(animated: true) { [weak self] in
            guard let self = self else { return }
            
            switch action {
            case .saved:
                self.currentResolve?(true)
            case .canceled:
                self.currentResolve?(false)
            case .deleted:
                self.currentResolve?(false)
            @unknown default:
                self.currentResolve?(false)
            }
            
            self.currentResolve = nil
            self.currentReject = nil
        }
    }
    
    private func rejectWithError(code: String, message: String) {
        currentReject?(code, message, nil)
        currentResolve = nil
        currentReject = nil
    }
}
